

import psycopg2
from psycopg2 import OperationalError, errorcodes, errors

conn = None  # Ensure conn is always defined

try:
    # Aiven database connection
    conn = psycopg2.connect('postgres://avnadmin:AVNS_vBiPLJt2YvOvpq0V7Ha@pg-1b73eb6f-livingatlas-livingatlasdb.l.aivencloud.com:13918/defaultdb?sslmode=require')
    print('Connection Success!')
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