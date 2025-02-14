
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







#This endpoint gives all the data with the labels in the return 
@filterbar_router.get("/allCards")
def allCards():
    cur.execute(f"""
                SELECT Users.Username, Users.Email, Cards.title, Categories.CategoryLabel, Cards.dateposted, Cards.description, Cards.organization, Cards.funding, Cards.link, STRING_AGG(Tags.TagLabel, ', ') AS TagLabels, Cards.latitude, Cards.longitude, Files.FileExtension, Files.FileID
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
                GROUP BY Cards.CardID, Categories.CategoryLabel, Files.FileExtension, Files.FileID, Users.Username, Users.Email
                ORDER BY Cards.CardID DESC;
                
                """)
                #LIMIT 6;
    
    rows = cur.fetchall()
    columns = ["username", "email", "title", "category", "date", "description", "org", "funding", "link", "tags", "latitude", "longitude", "fileEXT", "fileID"]
    data = [dict(zip(columns, row)) for row in rows]
    return {"data": data}







#This returns the every tag label for the drop down menu.
@filterbar_router.get("/tagList")
def tagList():
    cur.execute('SELECT taglabel FROM tags ORDER BY taglabel')
    rows = cur.fetchall()
    return {"tagList": rows}







#This endpoint gives all the data with the labels in the return from the filtered tag that was selected
@filterbar_router.get("/allCardsByTag")
async def allCardsByTag(categoryString: str = None, tagString: str = None):

    # if parameters are empty then cut this endpoint off fast
    if categoryString is None and tagString is None:
        return {"Parameter Error": "Need to pass something to this endpoint to return a card"}

    # Define the query strings
    finalQUERY = ("""
        SELECT u.Username, u.Email, c.Title, cat.CategoryLabel, c.DatePosted, c.Description, c.Organization, c.Funding, c.Link, 
        STRING_AGG(t.TagLabel, ', ') AS TagLabels, c.Latitude, c.Longitude, f.FileExtension, f.FileID
        FROM Users u
        JOIN Cards c ON u.UserID = c.UserID
        JOIN CardTags ct ON c.CardID = ct.CardID
        JOIN Tags t ON ct.TagID = t.TagID
        JOIN Categories cat ON c.CategoryID = cat.CategoryID
        LEFT JOIN Files f ON c.CardID = f.CardID
        WHERE 
    """)

    botStringQuery = """
        GROUP BY c.CardID, u.Username, u.Email, c.Title, cat.CategoryLabel, c.DatePosted, c.Description, 
        c.Organization, c.Funding, c.Link, c.Latitude, c.Longitude, f.FileExtension, f.FileID
    """

    # Add category filter with case-insensitivity
    if categoryString:
        finalQUERY += f"LOWER(cat.CategoryLabel) = LOWER('{categoryString}')"
        if tagString:
            finalQUERY += "\nAND "

    # Add tag filter with case-insensitivity
    if tagString:
        tags = tagString.split(',')
        tags = ', '.join(f"LOWER('{tag.strip()}')" for tag in tags)
        tag_count = len(tags.split(','))
        justWHERE_TAG = (f"""
            (SELECT COUNT(*) 
            FROM CardTags ct2
            JOIN Tags t2 ON ct2.TagID = t2.TagID
            WHERE ct2.CardID = c.CardID AND LOWER(t2.TagLabel) IN ({tags})) = {tag_count}
        """)
        finalQUERY += justWHERE_TAG

    finalQUERY += botStringQuery

    cur.execute(finalQUERY)
    rows = cur.fetchall()
    columns = ["username", "email", "title", "category", "date", "description", "org", "funding", "link", "tags", "latitude", "longitude", "fileEXT", "fileID"]
    data = [dict(zip(columns, row)) for row in rows]
    return {"data": data}







@filterbar_router.get("/searchBar")
def searchBar(titleSearch: str):
   cur.execute("""
           SELECT Users.Username, Users.Email, Cards.title, Categories.CategoryLabel, Cards.dateposted, Cards.description, Cards.organization, Cards.funding, Cards.link, STRING_AGG(Tags.TagLabel, ', ') AS TagLabels, Cards.latitude, Cards.longitude, Files.FileExtension, Files.FileID
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
           WHERE Cards.title ILIKE %s
           GROUP BY Cards.CardID, Categories.CategoryLabel, Files.FileExtension, Files.FileID, Users.Username, Users.Email
           
           """, ('%' + titleSearch + '%',))
   
   rows = cur.fetchall()
   columns = ["username", "email", "title", "category", "date", "description", "org", "funding", "link", "tags", "latitude", "longitude", "fileEXT", "fileID"]
   data = [dict(zip(columns, row)) for row in rows]
   return {"data": data}


