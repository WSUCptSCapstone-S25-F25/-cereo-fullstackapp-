import psycopg2
from psycopg2 import OperationalError, errorcodes, errors

conn = None  # Ensure conn is always defined

try:
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
    connectionsucceeded = False  # Mark connection failure

# Ensure cursor is only created if connection succeeded
if conn:
    cur = conn.cursor()
else:
    cur = None