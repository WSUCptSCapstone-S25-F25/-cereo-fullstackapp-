"""Create pgvector extension and doc_chunks table for chatbot RAG."""

import sys
import psycopg2


def main() -> int:
    conn = None
    cur = None

    try:
        # Use the same Azure PostgreSQL connection pattern as backend/database.py
        conn = psycopg2.connect(
            dbname="postgres",
            user="CereoAtlas",
            password="LivingAtlas25$",
            host="cereo-livingatlas-db.postgres.database.azure.com",
            port="5432",
            sslmode="require",
            connect_timeout=10,
        )
        cur = conn.cursor()
        print("[1/4] Connected to database.")

        cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        print("[2/4] pgvector extension is enabled.")

        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS doc_chunks (
                id        SERIAL PRIMARY KEY,
                source    TEXT,
                content   TEXT,
                embedding vector(1536)
            );
            """
        )
        print("[3/4] doc_chunks table is ready.")

        cur.execute(
            """
            CREATE INDEX IF NOT EXISTS doc_chunks_embedding_idx
            ON doc_chunks
            USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 50);
            """
        )
        print("[4/4] doc_chunks_embedding_idx is ready.")

        conn.commit()
        print("Done: pgvector setup completed successfully.")
        return 0

    except Exception as exc:
        if conn:
            conn.rollback()
        print(f"Error: failed to set up pgvector/doc_chunks. {exc}")
        return 1

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


if __name__ == "__main__":
    sys.exit(main())
