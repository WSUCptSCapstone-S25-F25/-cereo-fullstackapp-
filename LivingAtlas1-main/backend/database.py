import psycopg2
from psycopg2 import OperationalError, errorcodes, errors

conn = None  # Ensure conn is always defined

try:

    # psql "host=cereo-livingatlas-db.postgres.database.azure.com port=5432 dbname=postgres user=CereoAtlas password=LivingAtlas25$ sslmode=require"
    

    # Azure PostgreSQL database connection
    conn = psycopg2.connect(
        dbname="postgres", 
        user="CereoAtlas",
        password="LivingAtlas25$",
        host="cereo-livingatlas-db.postgres.database.azure.com",
        port="5432",
        sslmode="require"  # Required for Azure PostgreSQL
    )
    print("Database Connection Success!")
    connectionsucceeded = True

except OperationalError as e:
    print("Unable to connect to the database")
    print(f"Error: {e}")

    if conn:
        conn.rollback()  # Force rollback if stuck in error state
    connectionsucceeded = False


# Ensure cursor is only created if connection succeeded
if conn:
    cur = conn.cursor()
else:
    cur = None


# -----------------------------------------------------------
# Auto-apply pending schema migrations (idempotent)
# -----------------------------------------------------------
def _ensure_schema():
    """Run on every startup to guarantee the schema is up-to-date."""
    if not conn or not cur:
        return
    try:
        # Migration 003 — LocationType column + CardPolygonVertices table
        cur.execute("""
            ALTER TABLE Cards ADD COLUMN IF NOT EXISTS LocationType VARCHAR(10) DEFAULT 'point';
        """)
        # Make Latitude / Longitude nullable (safe even if already nullable)
        cur.execute("""
            ALTER TABLE Cards ALTER COLUMN Latitude DROP NOT NULL;
        """)
        cur.execute("""
            ALTER TABLE Cards ALTER COLUMN Longitude DROP NOT NULL;
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS CardPolygonVertices (
                VertexID SERIAL PRIMARY KEY,
                CardID INT NOT NULL,
                VertexOrder INT NOT NULL,
                Latitude DECIMAL(10,8) NOT NULL,
                Longitude DECIMAL(11,8) NOT NULL,
                FOREIGN KEY (CardID) REFERENCES Cards(CardID) ON DELETE CASCADE
            );
        """)
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_card_polygon_cardid
            ON CardPolygonVertices(CardID, VertexOrder);
        """)

        # Migration 004 — None / Other categories + CategoryID nullable
        cur.execute("""
            INSERT INTO Categories (CategoryID, CategoryLabel)
            VALUES (4, 'None'), (5, 'Other')
            ON CONFLICT (CategoryID) DO NOTHING;
        """)
        cur.execute("""
            ALTER TABLE Cards ALTER COLUMN CategoryID DROP NOT NULL;
        """)

        # Migration 005 — Polygon style columns (fill color + line style)
        cur.execute("""
            ALTER TABLE Cards ADD COLUMN IF NOT EXISTS PolygonFillColor VARCHAR(20) DEFAULT '#0077c0';
        """)
        cur.execute("""
            ALTER TABLE Cards ADD COLUMN IF NOT EXISTS PolygonLineStyle VARCHAR(20) DEFAULT 'solid';
        """)

        conn.commit()
        print("[MIGRATIONS] Schema is up-to-date.")
    except Exception as e:
        conn.rollback()
        print(f"[MIGRATIONS] Error applying migrations: {e}")

_ensure_schema()