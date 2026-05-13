"""
chat.py  —  /chat/ask endpoint

Embedding: local fastembed (BAAI/bge-small-en-v1.5), runs in-process.
Generation: DeepSeek API (OpenAI-compatible). Set DEEPSEEK_API on Render.
  Model is configured via DEEPSEEK_MODEL env var (default: deepseek-v4-flash).
"""

import os
from typing import Any

import psycopg2
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from openai import APIConnectionError, APITimeoutError, OpenAI, OpenAIError

chat_router = APIRouter(prefix="/chat", tags=["chat"])
_LOCAL_EMBEDDER = None
_LOCAL_EMBEDDER_NAME = None

# ---------------------------------------------------------------------------
# System prompt: gives the model context about the Living Atlas project
# ---------------------------------------------------------------------------
SYSTEM_PROMPT_BASE = """You are the RWC Living Atlas Helper, an AI assistant for the
Regional Water Center (RWC) Living Atlas web application — an interactive map
that showcases environmental datasets, GIS layers, and research resources for
the Pacific Northwest (Idaho, Oregon, and Washington).

Answer the user's question using the reference documentation provided below.
If the documentation does not cover the question, say so honestly — do not invent information.
Be concise, friendly, and factual.
Do not answer questions unrelated to the Living Atlas or environmental/GIS topics.

⚠️ This feature is under development. Always verify critical information with the original data source.
"""


def get_db_connection():
    """Use the same Azure PostgreSQL connection pattern as backend/database.py."""
    return psycopg2.connect(
        dbname="postgres",
        user="CereoAtlas",
        password="LivingAtlas25$",
        host="cereo-livingatlas-db.postgres.database.azure.com",
        port="5432",
        sslmode="require",
        connect_timeout=10,
    )


def get_local_embedder():
    """Create/reuse local embedding model."""
    global _LOCAL_EMBEDDER, _LOCAL_EMBEDDER_NAME
    model_name = os.environ.get("LOCAL_EMBED_MODEL", "BAAI/bge-small-en-v1.5")

    if _LOCAL_EMBEDDER is not None and _LOCAL_EMBEDDER_NAME == model_name:
        return _LOCAL_EMBEDDER

    from fastembed import TextEmbedding

    _LOCAL_EMBEDDER = TextEmbedding(model_name=model_name)
    _LOCAL_EMBEDDER_NAME = model_name
    return _LOCAL_EMBEDDER


def embed_query_local(text: str) -> list[float]:
    embedder = get_local_embedder()
    vector = next(embedder.embed([text]))
    return [float(value) for value in vector.tolist()]


def get_relevant_docs(question: str, top_k: int = 3) -> str:
    """Fetch top-k relevant chunks by cosine distance. Fail silently."""
    conn = None
    cur = None
    try:
        embedding = embed_query_local(question)
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT content
            FROM doc_chunks
            ORDER BY embedding <=> %s::vector
            LIMIT %s
            """,
            (str(embedding), top_k),
        )
        rows = cur.fetchall()
        if not rows:
            return ""
        return "\n\n---\n\n".join(row[0] for row in rows if row and row[0])
    except Exception as exc:
        print(f"[chat] Retrieval warning: {exc}")
        return ""
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

# ---------------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    question: str
    history: list[dict[str, Any]] = Field(default_factory=list)

class ChatResponse(BaseModel):
    answer: str

# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------
@chat_router.post("/ask", response_model=ChatResponse)
def ask(payload: ChatRequest):
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question must not be empty.")

    api_key = os.environ.get("DEEPSEEK_API")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Chatbot is not configured (missing DEEPSEEK_API). Please contact the administrator.",
        )

    context = get_relevant_docs(question)
    if context:
        system_prompt = (
            SYSTEM_PROMPT_BASE
            + "\n\n=== REFERENCE DOCUMENTATION ===\n"
            + context
        )
    else:
        system_prompt = SYSTEM_PROMPT_BASE

    client = OpenAI(base_url="https://api.deepseek.com", api_key=api_key)
    model = os.environ.get("DEEPSEEK_MODEL", "deepseek-v4-flash")

    messages = [{"role": "system", "content": system_prompt}]

    for msg in payload.history[-6:]:
        role = msg.get("role") if isinstance(msg, dict) else None
        text = msg.get("text") if isinstance(msg, dict) else None
        if role in {"user", "assistant"} and isinstance(text, str) and text.strip():
            messages.append({"role": role, "content": text})

    messages.append({"role": "user", "content": question})

    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=600,
            temperature=0.4,
        )
        answer = response.choices[0].message.content.strip()
        return ChatResponse(answer=answer)
    except Exception as e:
        err_str = str(e)
        lowered = err_str.lower()
        status_code = getattr(e, "status_code", None)

        if isinstance(e, (APIConnectionError, APITimeoutError)) or "connection error" in lowered or "timed out" in lowered:
            raise HTTPException(
                status_code=503,
                detail=(
                    "The chatbot is temporarily unavailable because the DeepSeek API "
                    "could not be reached. Please try again later or contact the administrator."
                ),
            ) from e

        if status_code == 402 or "insufficient_balance" in lowered or "402" in err_str:
            raise HTTPException(
                status_code=402,
                detail=(
                    "The chatbot is temporarily unavailable because the DeepSeek API credits "
                    "have been exhausted. Please contact the administrator."
                ),
            ) from e

        if status_code in {401, 403} or "authentication" in lowered or "permission" in lowered:
            raise HTTPException(
                status_code=503,
                detail=(
                    "The chatbot is temporarily unavailable because the DeepSeek API "
                    "credentials are invalid or unauthorized. Please contact the administrator."
                ),
            ) from e

        if status_code == 429 or "rate limit" in lowered:
            raise HTTPException(
                status_code=503,
                detail=(
                    "The chatbot is temporarily unavailable because the DeepSeek API "
                    "rate limit was reached. Please try again later."
                ),
            ) from e

        raise HTTPException(status_code=502, detail=f"AI service error: {err_str}") from e

