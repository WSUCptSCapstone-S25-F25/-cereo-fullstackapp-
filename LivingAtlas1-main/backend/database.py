




# database.py

import psycopg2
from psycopg2 import OperationalError, errorcodes, errors

try:
    # Old ElephantSQL database
    # conn = psycopg2.connect('postgres://tgpxaiud:5MBj7NqaMmQuFAS6iVHk8dmThMl3oc1M@bubble.db.elephantsql.com/tgpxaiud')

    # Aiven database
    # conn = psycopg2.connect('postgres://avnadmin:AVNS_vBiPLJt2YvOvpq0V7Ha@pg-1b73eb6f-livingatlas-livingatlasdb.l.aivencloud.com:13918/defaultdb?sslmode=require')
    
    # Azure database
    conn = psycopg2.connect(
        host="cereo-livingatlas-db.postgres.database.azure.com",
        port=5432,
        dbname="postgres",
        user="CereoAtlas",
        password="LivingAtlas25$",
        sslmode="require"
    )
    print('Connection Success!')
    connectionsucceeded = True

except Exception as e:
   print("Unable to connect to the database")

# Open a cursor to execute SQL queries
cur = conn.cursor()
