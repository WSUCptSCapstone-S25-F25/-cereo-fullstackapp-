"""
map
    get markers
    update boundry
"""

from fastapi import APIRouter, HTTPException
from database import conn, cur
from pydantic import BaseModel

map_router = APIRouter()

class Point(BaseModel):
    lat: float
    long: float

# GET ALL MARKERS
@map_router.get("/getMarkers")
def getMarkers():
    try:
        cur.execute("""
            SELECT Cards.CardID, Cards.Title, Cards.Latitude, Cards.Longitude,
                   Categories.CategoryLabel AS Category,
                   STRING_AGG(Tags.TagLabel, ', ') AS Tags
            FROM Cards
            LEFT JOIN Categories ON Cards.CategoryID = Categories.CategoryID
            LEFT JOIN CardTags ON Cards.CardID = CardTags.CardID
            LEFT JOIN Tags ON CardTags.TagID = Tags.TagID
            GROUP BY Cards.CardID, Cards.Title, Cards.Latitude, Cards.Longitude, Categories.CategoryLabel
        """)

        # Fix psycopg2.ProgrammingError when nothing is returned
        rows = cur.fetchall() if cur.description else []
        columns = ["cardID", "title", "latitude", "longitude", "category", "tags"]
        data = [dict(zip(columns, row)) for row in rows]
        return {"data": data}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# GET MARKERS WITHIN BOUNDS
@map_router.post("/updateBoundry")
def updateBoundry(NEpoint: Point, SWpoint: Point):
    try:
        cur.execute("""
            SELECT Cards.cardid, Users.Username, Users.Email, Cards.title, Categories.CategoryLabel, Cards.dateposted,
                   Cards.description, Cards.organization, Cards.funding, Cards.link,
                   STRING_AGG(Tags.TagLabel, ', ') AS TagLabels,
                   Cards.latitude, Cards.longitude,
                   Cards.thumbnail_link,
                   Files.FileExtension, Files.FileID
            FROM Cards
            INNER JOIN Categories ON Cards.CategoryID = Categories.CategoryID
            LEFT JOIN Files ON Cards.cardid = Files.CardID
            LEFT JOIN CardTags ON Cards.cardid = CardTags.CardID
            LEFT JOIN Tags ON CardTags.TagID = Tags.TagID
            INNER JOIN Users ON Cards.UserID = Users.UserID
            WHERE Cards.latitude BETWEEN %s AND %s
              AND Cards.longitude BETWEEN %s AND %s
            GROUP BY Cards.cardid, Categories.CategoryLabel, Files.FileExtension,
                     Files.FileID, Users.Username, Users.Email, Cards.Thumbnail_link
        """, (SWpoint.lat, NEpoint.lat, SWpoint.long, NEpoint.long))

        rows = cur.fetchall() if cur.description else []
        columns = [
            "cardID", "username", "email", "title", "category", "date", "description", "org", "funding", "link",
            "tags", "latitude", "longitude", "thumbnail_link", "fileEXT", "fileID"
        ]
        data = [dict(zip(columns, row)) for row in rows]
        return {"data": data}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
