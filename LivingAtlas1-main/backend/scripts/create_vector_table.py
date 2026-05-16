"""Create pgvector extension and doc_chunks table for chatbot RAG."""

import os
import sys
import psycopg2


def main() -> int:
    conn = None
    cur = None
    embedding_dim = int(os.environ.get("EMBEDDING_DIM", "384"))
    target_vector_type = f"vector({embedding_dim})"

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
            SELECT format_type(a.atttypid, a.atttypmod)
            FROM pg_attribute a
            JOIN pg_class c ON a.attrelid = c.oid
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE c.relname = 'doc_chunks'
              AND n.nspname = 'public'
              AND a.attname = 'embedding'
              AND a.attnum > 0
              AND NOT a.attisdropped;
            """
        )
        existing_vector_type_row = cur.fetchone()
        existing_vector_type = existing_vector_type_row[0] if existing_vector_type_row else None

        if existing_vector_type and existing_vector_type != target_vector_type:
            print(
                f"[3/4] Existing doc_chunks embedding type is {existing_vector_type}; "
                f"migrating to {target_vector_type} by recreating doc_chunks."
            )
            cur.execute("DROP INDEX IF EXISTS doc_chunks_embedding_idx;")
            cur.execute("DROP TABLE IF EXISTS doc_chunks;")
        else:
            print(f"[3/4] Using embedding type {target_vector_type}.")

        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS doc_chunks (
                id        SERIAL PRIMARY KEY,
                source    TEXT,
                content   TEXT,
                embedding vector(%s)
            );
            """
            % embedding_dim
        )
        print("[4/5] doc_chunks table is ready.")

        cur.execute(
            """
            CREATE INDEX IF NOT EXISTS doc_chunks_embedding_idx
            ON doc_chunks
            USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 50);
            """
        )
        print("[5/5] doc_chunks_embedding_idx is ready.")

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
