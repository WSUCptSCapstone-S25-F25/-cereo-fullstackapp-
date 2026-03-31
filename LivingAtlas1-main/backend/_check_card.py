import psycopg2

conn = psycopg2.connect(
    dbname='postgres',
    user='CereoAtlas',
    password='LivingAtlas25$',
    host='cereo-livingatlas-db.postgres.database.azure.com',
    port='5432',
    sslmode='require'
)
cur = conn.cursor()

BROKEN_URL = "https://storage.googleapis.com/cereo_atlas_storage/thumbnails/default_cereo_thumbnail.png"

# Find affected cards
cur.execute("SELECT CardID, Title FROM Cards WHERE Thumbnail_Link = %s", (BROKEN_URL,))
broken_cards = cur.fetchall()
print(f"Found {len(broken_cards)} cards with broken default thumbnail:")
for cid, title in broken_cards:
    print(f"  CardID={cid} Title={title}")

# Fix Cards.Thumbnail_Link
cur.execute("UPDATE Cards SET Thumbnail_Link = NULL WHERE Thumbnail_Link = %s", (BROKEN_URL,))
cards_fixed = cur.rowcount

# Fix CardImages rows that also point to the broken URL
cur.execute("DELETE FROM CardImages WHERE ImageURL = %s", (BROKEN_URL,))
images_fixed = cur.rowcount

conn.commit()
print(f"\nFixed {cards_fixed} cards (Thumbnail_Link set to NULL)")
print(f"Removed {images_fixed} broken CardImages rows")

cur.close()
conn.close()
