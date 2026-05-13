"""Index backend/docs markdown files into doc_chunks with OpenAI embeddings."""

import os
import sys
from pathlib import Path

import psycopg2
from openai import OpenAI

MAX_CHARS = 400
EMBED_MODEL = "text-embedding-3-small"


def get_db_connection():
    """Use the same connection parameters as backend/database.py."""
    return psycopg2.connect(
        dbname="postgres",
        user="CereoAtlas",
        password="LivingAtlas25$",
        host="cereo-livingatlas-db.postgres.database.azure.com",
        port="5432",
        sslmode="require",
        connect_timeout=10,
    )


def chunk_markdown(text: str, max_chars: int = MAX_CHARS) -> list[str]:
    """Split by paragraphs, then merge short consecutive paragraphs up to max_chars."""
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks: list[str] = []
    current = ""

    for paragraph in paragraphs:
        if not current:
            current = paragraph
            continue

        candidate = f"{current}\n\n{paragraph}"
        if len(candidate) <= max_chars:
            current = candidate
        else:
            chunks.append(current)
            current = paragraph

    if current:
        chunks.append(current)

    return [chunk for chunk in chunks if chunk.strip()]


def embed_text(client: OpenAI, text: str) -> list[float]:
    """Get embedding vector from OpenAI."""
    result = client.embeddings.create(model=EMBED_MODEL, input=text)
    return result.data[0].embedding


def main() -> int:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("Missing OPENAI_API_KEY environment variable.")

    docs_dir = Path(__file__).resolve().parents[1] / "docs"
    md_files = sorted(docs_dir.glob("*.md"))

    if not md_files:
        print(f"No markdown files found in {docs_dir}")
        return 0

    client = OpenAI(api_key=api_key)
    conn = None
    cur = None
    total_chunks = 0

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("DELETE FROM doc_chunks")

        for md_file in md_files:
            text = md_file.read_text(encoding="utf-8")
            chunks = chunk_markdown(text)
            inserted_for_file = 0

            for chunk in chunks:
                embedding = embed_text(client, chunk)
                cur.execute(
                    "INSERT INTO doc_chunks (source, content, embedding) VALUES (%s, %s, %s::vector)",
                    (md_file.name, chunk, str(embedding)),
                )
                inserted_for_file += 1

            total_chunks += inserted_for_file
            print(f"\u2713 Indexed {md_file.name} -- {inserted_for_file} chunks")

        conn.commit()
        print(f"Done. Total chunks indexed: {total_chunks}")
        return 0

    except Exception:
        if conn:
            conn.rollback()
        raise

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Indexing failed: {exc}")
        raise
