import psycopg2

try:
    conn = psycopg2.connect(
        dbname="defaultdb",
        user="avnadmin",
        password="AVNS_vBiPLJt2YvOvpq0V7Ha",
        host="pg-1b73eb6f-livingatlas-livingatlasdb.l.aivencloud.com",
        port="13918",
        sslmode="require"
    )
    print("Successfully connected to Aiven PostgreSQL!")
    conn.close()
except Exception as e:
    print(f" Connection failed: {e}")