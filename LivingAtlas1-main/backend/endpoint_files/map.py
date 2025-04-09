
"""
map
    get markers
    update boundry
"""





from fastapi import APIRouter
from database import conn, cur

from pydantic import BaseModel


map_router = APIRouter()






class Point(BaseModel):
    lat: float
    long: float






#returns all items cardid, title, lat, Long, category, tags
@map_router.get("/getMarkers")
def getMarkers():
    cur.execute(f"""
    SELECT Cards.CardID, Cards.Title, Cards.Latitude, Cards.Longitude, Categories.CategoryLabel AS Category, STRING_AGG(Tags.TagLabel, ', ') AS Tags
    FROM Cards
    LEFT JOIN Categories ON Cards.CategoryID = Categories.CategoryID
    LEFT JOIN CardTags ON Cards.CardID = CardTags.CardID
    LEFT JOIN Tags ON CardTags.TagID = Tags.TagID
    GROUP BY Cards.CardID, Cards.Title, Cards.Latitude, Cards.Longitude, Categories.CategoryLabel;""")

    rows = cur.fetchall()
    columns = ["cardID", "title", "latitude", "longitude", "category", "tags"]
    data = [dict(zip(columns, row)) for row in rows]
    return {"data": data}







# returns the same data as allCards but within a lat long section of space
@map_router.post("/updateBoundry")
def updateBoundry(NEpoint: Point, SWpoint: Point):
    cur.execute("""
        SELECT Users.Username, Users.Email, Cards.title, Categories.CategoryLabel, Cards.dateposted,
               Cards.description, Cards.organization, Cards.funding, Cards.link,
               STRING_AGG(Tags.TagLabel, ', ') AS TagLabels,
               Cards.latitude, Cards.longitude,
               Cards.thumbnail_link,  -- include thumbnail link
               Files.FileExtension, Files.FileID
        FROM Cards
        INNER JOIN Categories
        ON Cards.CategoryID = Categories.CategoryID
        LEFT JOIN Files
        ON Cards.CardID = Files.CardID
        LEFT JOIN CardTags
        ON Cards.CardID = CardTags.CardID
        LEFT JOIN Tags
        ON CardTags.TagID = Tags.TagID
        INNER JOIN Users
        ON Cards.UserID = Users.UserID
        WHERE Cards.latitude BETWEEN %s AND %s
        AND Cards.longitude BETWEEN %s AND %s
        GROUP BY Cards.CardID, Categories.CategoryLabel, Files.FileExtension, Files.FileID, Users.Username, Users.Email, Cards.thumbnail_link
    """, (SWpoint.lat, NEpoint.lat, SWpoint.long, NEpoint.long))

    rows = cur.fetchall()
    columns = [
        "username", "email", "title", "category", "date", "description", "org", "funding", "link",
        "tags", "latitude", "longitude", "thumbnail_link",  # add to output
        "fileEXT", "fileID"
    ]
    data = [dict(zip(columns, row)) for row in rows]
    return {"data": data}

"""
#Here is a test react call to this endpoint
const NEpoint = { lat: 40.7128, long: -74.0060 }; // Example values
const SWpoint = { lat: 34.0522, long: -118.2437 }; // Example values

fetch(`http://localhost:8000/updateBoundry?NEpoint=${JSON.stringify(NEpoint)}&SWpoint=${JSON.stringify(SWpoint)}`)
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
"""
