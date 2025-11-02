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
            SELECT 
                c.CardID,
                u.Username,
                u.Email,
                c.Title,
                cat.CategoryLabel,
                c.DatePosted,
                c.Description,
                c.Organization,
                c.Funding,
                c.Link,
                STRING_AGG(DISTINCT t.TagLabel, ', ') AS TagLabels,
                c.Latitude,
                c.Longitude,
                c.Thumbnail_Link,
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'fileid', f.fileid,
                            'filename', f.filename,
                            'filelink', f.file_link,
                            'fileextension', f.filextension
                        )
                    ) FILTER (WHERE f.FileID IS NOT NULL),
                    '[]'
                ) AS files
            FROM Cards c
            INNER JOIN Categories cat ON c.CategoryID = cat.CategoryID
            LEFT JOIN Files f ON c.CardID = f.CardID
            LEFT JOIN CardTags ct ON c.CardID = ct.CardID
            LEFT JOIN Tags t ON ct.TagID = t.TagID
            INNER JOIN Users u ON c.UserID = u.UserID
            WHERE c.Latitude BETWEEN %s AND %s
              AND c.Longitude BETWEEN %s AND %s
            GROUP BY c.CardID, cat.CategoryLabel, u.Username, u.Email, c.Thumbnail_link
            ORDER BY c.CardID DESC;
        """, (SWpoint.lat, NEpoint.lat, SWpoint.long, NEpoint.long))

        rows = cur.fetchall() if cur.description else []
        columns = [
            "cardID", "username", "email", "title", "category", "date", "description", "org",
            "funding", "link", "tags", "latitude", "longitude", "thumbnail_link", "files"
        ]
        data = [dict(zip(columns, row)) for row in rows]
        return {"data": data}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))