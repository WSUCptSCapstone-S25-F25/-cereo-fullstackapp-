"""
filterbar
    allCards
    tag list
    all cards by tag      --ToDo: protect against sql injection
    search bar            
"""

from fastapi import APIRouter
from database import conn, cur

filterbar_router = APIRouter()


# This endpoint gives all the data with the labels in the return 
@filterbar_router.get("/allCards")
def allCards():
    cur.execute("""
        SELECT 
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
                        'file_link', f.file_link,
                        'fileextension', f.fileextension
                    )
                ) FILTER (WHERE f.fileid IS NOT NULL),
                '[]'
            ) AS files
        FROM Cards c
        INNER JOIN Categories cat ON c.CategoryID = cat.CategoryID
        LEFT JOIN Files f ON c.CardID = f.CardID
        LEFT JOIN CardTags ct ON c.CardID = ct.CardID
        LEFT JOIN Tags t ON ct.TagID = t.TagID
        INNER JOIN Users u ON c.UserID = u.UserID
        GROUP BY c.CardID, cat.CategoryLabel, u.Username, u.Email
        ORDER BY c.CardID DESC;
    """)
    
    rows = cur.fetchall()
    columns = [
        "username", "email", "title", "category", "date", "description", "org",
        "funding", "link", "tags", "latitude", "longitude", "thumbnail_link", "files"
    ]
    data = [dict(zip(columns, row)) for row in rows]
    return {"data": data}



# This returns every tag label for the drop down menu.
@filterbar_router.get("/tagList")
def tagList():
    cur.execute('SELECT taglabel FROM tags ORDER BY taglabel')
    rows = cur.fetchall()
    return {"tagList": rows}



# This endpoint gives all the data with the labels in the return from the filtered tag that was selected
@filterbar_router.get("/allCardsByTag")
async def allCardsByTag(categoryString: str = None, tagString: str = None, sortString: str = None):

    if categoryString is None and tagString is None:
        return {"Parameter Error": "Need to pass something to this endpoint to return a card"}

    finalQUERY = ("""
        SELECT 
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
                        'file_link', f.file_link,
                        'fileextension', f.fileextension
                    )
                ) FILTER (WHERE f.fileid IS NOT NULL),
                '[]'
            ) AS files
    """)

    if sortString:
        sortSplit = sortString.split(',')
        if sortSplit[0] == "ClosestToMe":
            latitude = sortSplit[1]
            longitude = sortSplit[2]
            finalQUERY += f""", SQRT(POWER(c.Latitude - {latitude}, 2) + POWER(c.Longitude - {longitude}, 2)) AS distance"""

    finalQUERY += """
        FROM Users u
        JOIN Cards c ON u.UserID = c.UserID
        LEFT JOIN CardTags ct ON c.CardID = ct.CardID
        LEFT JOIN Tags t ON ct.TagID = t.TagID
        JOIN Categories cat ON c.CategoryID = cat.CategoryID
        LEFT JOIN Files f ON c.CardID = f.CardID
    """

    botStringQuery = """
        GROUP BY c.CardID, cat.CategoryLabel, u.Username, u.Email
    """

    if categoryString or tagString:
        finalQUERY += " WHERE "
        if categoryString:
            finalQUERY += f"LOWER(cat.CategoryLabel) = LOWER('{categoryString}')"
            if tagString:
                finalQUERY += " AND "
        if tagString:
            tags = tagString.split(',')
            tags = ', '.join(f"LOWER('{tag.strip()}')" for tag in tags)
            tag_count = len(tags.split(','))
            finalQUERY += f"""
                (SELECT COUNT(*) 
                 FROM CardTags
                 JOIN Tags ON CardTags.TagID = Tags.TagID
                 WHERE CardTags.CardID = c.CardID AND LOWER(Tags.TagLabel) IN ({tags})) = {tag_count}
            """

    finalQUERY += botStringQuery

    if sortString:
        sortSplit = sortString.split(',')
        if sortSplit[0] == "ClosestToMe":
            finalQUERY += " ORDER BY distance ASC"
        elif sortSplit[0] == "RecentlyAdded":
            finalQUERY += " ORDER BY c.DatePosted DESC"

    cur.execute(finalQUERY)
    rows = cur.fetchall()
    columns = [
        "username", "email", "title", "category", "date", "description", "org",
        "funding", "link", "tags", "latitude", "longitude", "thumbnail_link", "files"
    ]
    data = [dict(zip(columns, row)) for row in rows]
    return {"data": data}



@filterbar_router.get("/searchBar")
def searchBar(titleSearch: str):
   cur.execute("""
      SELECT 
            u.Username,
            c.Name,
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
                        'file_link', f.file_link,
                        'fileextension', f.fileextension
                    )
                ) FILTER (WHERE f.fileid IS NOT NULL),
                '[]'
            ) AS files
      FROM Cards c
      INNER JOIN Categories
      INNER JOIN Categories cat ON c.CategoryID = cat.CategoryID
      LEFT JOIN Files f ON c.CardID = f.CardID
      LEFT JOIN CardTags ct ON c.CardID = ct.CardID
      LEFT JOIN Tags t ON ct.TagID = t.TagID
      INNER JOIN Users u ON c.UserID = u.UserID
      WHERE c.Title ILIKE %s
      GROUP BY c.CardID, cat.CategoryLabel, u.Username, u.Email
      ORDER BY c.CardID DESC
   """, ('%' + titleSearch + '%',))
   
   rows = cur.fetchall()
   columns = [
        "username", "name", "email", "title", "category", "date", "description", "org",
        "funding", "link", "tags", "latitude", "longitude", "thumbnail_link", "files"
    ]
   data = [dict(zip(columns, row)) for row in rows]
   return {"data": data}
