#!/usr/bin/env python3
"""
Quick script to check ArcGIS services data in the database
"""

import psycopg2
from psycopg2 import OperationalError

def check_database():
    try:
        # Connect to Azure PostgreSQL database
        conn = psycopg2.connect(
            dbname="postgres", 
            user="CereoAtlas",
            password="LivingAtlas25$",
            host="cereo-livingatlas-db.postgres.database.azure.com",
            port="5432",
            sslmode="require"
        )
        
        cur = conn.cursor()
        
        # Check if table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'arcgis_services'
            );
        """)
        table_exists = cur.fetchone()[0]
        
        if table_exists:
            print("✅ arcgis_services table exists")
            
            # Count total records
            cur.execute("SELECT COUNT(*) FROM arcgis_services;")
            total_count = cur.fetchone()[0]
            print(f"📊 Total records: {total_count}")
            
            # Count by state and type
            cur.execute("""
                SELECT state, type, COUNT(*) as count 
                FROM arcgis_services 
                GROUP BY state, type 
                ORDER BY state, type;
            """)
            state_counts = cur.fetchall()
            
            print("\n📈 Records by state and type:")
            for state, service_type, count in state_counts:
                print(f"  {state} - {service_type}: {count}")
            
            # Sample records
            cur.execute("""
                SELECT service_key, label, state, type 
                FROM arcgis_services 
                LIMIT 5;
            """)
            samples = cur.fetchall()
            
            print("\n🔍 Sample records:")
            for key, label, state, service_type in samples:
                print(f"  {state}: {key} - {label} ({service_type})")
                
        else:
            print("❌ arcgis_services table does not exist")
            
        cur.close()
        conn.close()
        
    except OperationalError as e:
        print(f"❌ Database connection failed: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_database()