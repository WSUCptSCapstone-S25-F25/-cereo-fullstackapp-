"""
card
    delete card
    download file      
    upload form         

"""

from fastapi import APIRouter, File, Form, UploadFile, HTTPException, Response
from database import conn, cur
from io import BytesIO
from typing import Optional
from fastapi.responses import FileResponse
from google.cloud import storage
import psycopg2
import os
import uuid
import tempfile
from .file_utils import compress_file #importing my function that handles compressing files for use in /uploadForm


card_router = APIRouter()

import os, base64

# Decode the GCP credentials from the environment variable and write to file
# COMMENT OUT IF RUNNING LOCALLY

gcs_key = os.environ.get("GOOGLE_CREDENTIALS_BASE64")
if gcs_key:
    with open("ServiceKey_GoogleCloud.json", "wb") as f:
        f.write(base64.b64decode(gcs_key))
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = "ServiceKey_GoogleCloud.json"
# _______________________________________

# COMMENT OUT IF RUNNING ON RENDER
#os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = "ServiceKey_GoogleCloud.json"
# _______________________________________
        
storage_client = storage.Client()
bucket_name = "cereo_atlas_storage"
bucket = storage_client.bucket(bucket_name)
DEFAULT_THUMBNAIL_URL = "https://storage.googleapis.com/cereo_atlas_storage/thumbnails/default_cereo_thumbnail.png"

# Function to delete files from Google Cloud
def delete_from_bucket(blob_name):
    try:
        bucket = storage_client.get_bucket(bucket_name)
        blob = bucket.blob(blob_name)
        blob.delete()
        print(f"File: {blob_name} deleted.")
    except Exception as e:
        print(e)
        return

# Function to upload files to Google Cloud
def upload_to_bucket(blob_name, file_obj, file_type, bucket_name):
    try:
        bucket = storage_client.get_bucket(bucket_name)
        blob = bucket.blob(blob_name)
        blob.content_type = file_type
        blob.upload_from_file(file_obj)
        return True
    except Exception as e:
        print(e)
        return False

# Function to upload an image to Google Cloud Storage and return its URL
def upload_image(file: Optional[UploadFile]) -> str:
    if not file:
        return DEFAULT_THUMBNAIL_URL

    allowed_extensions = {"png", "jpg", "jpeg", "gif"}
    if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid thumbnail file type. Allowed: PNG, JPG, JPEG, GIF")

    try:
        # Rewind the file pointer to ensure it's readable
        file.file.seek(0)

        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        blob = bucket.blob(f"thumbnails/{unique_filename}")
        blob.upload_from_file(file.file, content_type=file.content_type)

        public_url = f"https://storage.googleapis.com/{bucket_name}/thumbnails/{unique_filename}"
        return public_url
    except Exception as e:
        print(f"Thumbnail upload error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload thumbnail image.")


@card_router.post("/create-card")
async def create_card(
    title: str = Form(...),
    description: str = Form(...),
    thumbnail: UploadFile = File(None)
):
    thumbnail_link = upload_image(thumbnail) if thumbnail else None
    cur.execute("INSERT INTO Cards (title, description, thumbnail_link) VALUES (%s, %s, %s)",
                (title, description, thumbnail_link))
    conn.commit()
    return {"message": "Card created successfully", "thumbnail_link": thumbnail_link}

@card_router.delete("/deleteCard")
async def deleteCard(username: str, title: str):
    if username is None or title is None:
        raise HTTPException(status_code=422, detail="Username and title must not be None")
    if not isinstance(username, str) or not isinstance(title, str):
        raise HTTPException(status_code=422, detail="Username and title must be strings")

    cur.execute("""
        SELECT Cards.CardID, Cards.thumbnail_link
        FROM Users
        JOIN Cards ON Users.UserID = Cards.UserID
        WHERE Users.Username = %s AND Cards.Title = %s
    """, (username, title))
    result = cur.fetchone()
    if result is None:
        raise HTTPException(status_code=404, detail="Card not found")
    cardID, thumbnail_link = result

    if thumbnail_link and thumbnail_link != DEFAULT_THUMBNAIL_URL:
        # Convert full URL to blob path by stripping bucket URL prefix:
        try:
            blob_path = thumbnail_link.replace(f"https://storage.googleapis.com/{bucket_name}/", "")
            delete_from_bucket(blob_path)
        except Exception as e:
            print(f"[WARN] Failed to parse/delete thumbnail: {e}")

    cur.execute("DELETE FROM Files WHERE CardID = %s", (cardID,))
    cur.execute("DELETE FROM CardTags WHERE CardID = %s", (cardID,))
    cur.execute("DELETE FROM Cards WHERE CardID = %s", (cardID,))
    conn.commit()
    return {"Success": "The card is deleted"}

@card_router.post("/bookmarkCard")
async def bookmark_card(username: str = Form(...), cardID: int = Form(...)):
    try:
        print(f"[BOOKMARK] Incoming request: username={username}, cardID={cardID}")
        cur.execute("""
            INSERT INTO Favorites (UserID, CardID)
            SELECT u.UserID, %s
            FROM Users u
            WHERE LOWER(u.Username) = LOWER(%s)
            ON CONFLICT DO NOTHING
        """, (cardID, username))
        conn.commit()
        return {"message": "Card bookmarked successfully"}
    except Exception as e:
        print(f"[BOOKMARK ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))

@card_router.post("/unbookmarkCard")
async def unbookmark_card(username: str = Form(...), cardID: int = Form(...)):
    try:
        print(f"[UNBOOKMARK] Incoming request: username={username}, card_id={cardID}")
        cur.execute("""
            DELETE FROM Favorites
            WHERE UserID = (SELECT UserID FROM Users WHERE LOWER(Username) = LOWER(%s))
              AND CardID = %s
        """, (username, cardID))
        conn.commit()
        return {"message": "Card removed from bookmarks"}
    except Exception as e:
        print(f"[UNBOOKMARK ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))

@card_router.get("/getBookmarkedCards")
def get_bookmarked_cards(username: str):
    try:
        username = username.strip()
        cur.execute("SELECT UserID FROM Users WHERE LOWER(Username) = LOWER(%s)", (username,))
        result = cur.fetchone()

        if not result:
            return {"bookmarkedCards": []}

        user_id = result[0]
        cur.execute("""
            SELECT c.CardID AS "cardID"
            FROM Favorites f
            JOIN Cards c ON f.CardID = c.CardID
            WHERE f.UserID = %s
        """, (user_id,))

        rows = cur.fetchall()
        columns = ["cardID"]
        data = [dict(zip(columns, row)) for row in rows]
        return {"bookmarkedCards": data}

    except Exception as e:
        print(f"[EXCEPTION] {e}")
        raise HTTPException(status_code=500, detail=str(e))

@card_router.get("/downloadFile")
async def downloadFile(fileID: int):
    """
    Return the public Google Cloud Storage link for a file by fileID.
    """
    cur.execute("SELECT filename, file_link FROM files WHERE fileid = %s", (fileID,))
    result = cur.fetchone()
    if result is None:
        raise HTTPException(status_code=422, detail="File is not in the database")

    filename, file_link = result

    # Option A: return direct link (preferred for cloud storage)
    return {"file_link": file_link, "filename": filename}

    # Option B: stream through backend (uncomment if you want proxying)
    # blob_name = file_link.replace(f"https://storage.googleapis.com/{bucket_name}/", "")
    # blob = bucket.blob(blob_name)
    # file_content = BytesIO()
    # blob.download_to_file(file_content)
    # file_content.seek(0)
    # return Response(
    #     file_content.read(),
    #     media_type="application/octet-stream",
    #     headers={"Content-Disposition": f"attachment; filename={filename}"}
    # )

@card_router.get("/allCards")
def allCards():
    try:
        cur.execute("""
            SELECT
                u.Username,
                u.Email,
                COALESCE(c.Name, '') AS Name,
                c.Title,
                c.CardID,
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
            GROUP BY
                c.CardID,
                cat.CategoryLabel,
                u.Username,
                u.Email,
                c.Name
            ORDER BY c.CardID DESC;
        """)

        columns = [
            "username", "email", "name", "title", "cardID", "category", "date", "description",
            "org", "funding", "link", "tags", "latitude", "longitude", "thumbnail_link", "files"
        ]

        rows = cur.fetchall()
        data = [dict(zip(columns, row)) for row in rows]
        return {"data": data}
    except Exception as e:
        print(f"An error occurred while fetching all cards: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
from .file_utils import compress_file
import tempfile

@card_router.post("/uploadForm")
async def upload_form(
    update: Optional[bool] = Form(False),
    title: str = Form(...),
    email: str = Form(...),
    username: str = Form(...),
    name: str = Form(...),
    original_username: Optional[str] = Form(None),
    original_email: Optional[str] = Form(None),
    category: str = Form(...),
    latitude: str = Form(...),
    longitude: str = Form(...),
    description: Optional[str] = Form(None),
    funding: Optional[str] = Form(None),
    org: Optional[str] = Form(None),
    link: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    files: Optional[list[UploadFile]] = File(None),   # <-- multiple files supported
    thumbnail: Optional[UploadFile] = File(None)      # THIS IS IMPORTANT
):
    """
    This endpoint submits/updates a Card
    """
    enable_commits = False

    # Safe debug print (avoid None concatenation)
    print(f"[UPLOAD] username={username}, email={email}, orig_username={original_username or ''}, orig_email={original_email or ''}")

    # Get next CardID
    cur.execute("SELECT MAX(CardID) FROM Cards")
    maxcardid = cur.fetchone()
    nextcardid = (maxcardid[0] or 0) + 1

    # Identify user performing the update/insert
    if update:
        # Updating → use original identity
        cur.execute(
            "SELECT userID FROM Users WHERE username = %s AND email = %s",
            (original_username, original_email)
        )
    else:
        # New card → use current username/email
        cur.execute(
            "SELECT userID FROM Users WHERE username = %s AND email = %s",
            (username, email)
        )

    user_row = cur.fetchone()
    if not user_row:
        raise HTTPException(status_code=404, detail="User not found")
    userID = user_row[0]

    # Convert category string to categoryID
    if category == "River":
        categoryID = 1
    elif category == "Watershed":
        categoryID = 2
    elif category == "Places":
        categoryID = 3
    else:
        raise HTTPException(status_code=400, detail="Category is not a valid item")

    # Define schema limits for testing
    title_limit = 255
    latitude_limit = (10, 8)
    longitude_limit = (11, 8)
    description_limit = 2000
    organization_limit = 255
    link_limit = 255

    # Validate fields
    if len(title) > title_limit:
        raise HTTPException(status_code=400, detail="Title exceeds 255 characters")

    try:
        latitude_val = float(latitude)
        if not (-90 <= latitude_val <= 90):
            raise HTTPException(status_code=400, detail="Latitude is out of bounds (-90 to 90)")
        if len(str(latitude_val).split('.')[-1]) > 8:
            raise HTTPException(status_code=400, detail="Latitude decimal places exceed 8")
    except ValueError:
        raise HTTPException(status_code=400, detail="Latitude is not a valid decimal number")

    try:
        longitude_val = float(longitude)
        if not (-180 <= longitude_val <= 180):
            raise HTTPException(status_code=400, detail="Longitude is out of bounds (-180 to 180)")
        if len(str(longitude_val).split('.')[-1]) > 8:
            raise HTTPException(status_code=400, detail="Longitude decimal places exceed 8")
    except ValueError:
        raise HTTPException(status_code=400, detail="Longitude is not a valid decimal number")

    if description is not None and len(description) > description_limit:
        raise HTTPException(status_code=400, detail="Description exceeds 2000 characters")
    if org is not None and len(org) > organization_limit:
        raise HTTPException(status_code=400, detail="Organization exceeds 255 characters")
    if link is not None and len(link) > link_limit:
        raise HTTPException(status_code=400, detail="Link exceeds 255 characters")

    print("Card Data Validated for CardID: ", nextcardid)

    # Upload thumbnail (custom or default)
    thumbnail_url = upload_image(thumbnail)

    # Inserting/Updating Card Data (includes thumbnail_url)
    try:
        enable_commits = False
        if update:
            cur.execute("""
                SELECT Cards.CardID
                FROM Users
                JOIN Cards ON Users.UserID = Cards.UserID
                WHERE Users.UserID = %s AND Cards.Title = %s
            """, (userID, title))
            card = cur.fetchone()
            if not card:
                raise HTTPException(status_code=404, detail="Card not found for update")

            nextcardid = card[0]

            if original_username and username != original_username:
                cur.execute("SELECT UserID FROM Users WHERE username = %s AND email = %s", (username, email))
                new_user = cur.fetchone()
                if not new_user:
                    raise HTTPException(status_code=404, detail="New username not found")
                userID = new_user[0]

            insert_script = """
                UPDATE Cards
                SET Name=%s,
                    Latitude=%s,
                    Longitude=%s,
                    CategoryID=%s,
                    Description=%s,
                    Organization=%s,
                    Funding=%s,
                    Link=%s,
                    Thumbnail_Link=COALESCE(%s, Thumbnail_Link),
                    UserID=%s
                WHERE CardID=%s
            """
            insert_value = (name, latitude_val, longitude_val, categoryID, description, org, funding,
                            link, thumbnail_url, userID, nextcardid)
            cur.execute(insert_script, insert_value)

            cur.execute("DELETE FROM CardTags WHERE CardID=%s", (nextcardid,))
        else:
            insert_script = """
                INSERT INTO Cards
                    (CardID, UserID, Name, Title, Latitude, Longitude, CategoryID,
                     Description, Organization, Funding, Link, Thumbnail_Link)
                VALUES
                    (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            insert_value = (nextcardid, userID, name, title, latitude_val, longitude_val,
                            categoryID, description, org, funding, link, thumbnail_url)
            cur.execute(insert_script, insert_value)

        print("Ready to commit CARDS to DB")
        enable_commits = True
    except psycopg2.DatabaseError as e:
        print(f"[DB ERROR] {e}")
        conn.rollback()
        raise HTTPException(status_code=500, detail="An error occurred while inserting the data.")
    except Exception as e:
        print(f"[UNEXPECTED ERROR] {e}")
        raise HTTPException(status_code=500, detail="Unexpected error while inserting card data.")

    # Inserting Unique Tag items if any
    if tags is not None and tags.strip() != "":
        try:
            user_tags = [tag.strip() for tag in tags.split(",") if tag.strip()]
            cur.execute("SELECT TagLabel FROM Tags")
            all_tag_list = cur.fetchall()
            masterTags = set(tag[0] for tag in all_tag_list)

            userTagsSet = set(user_tags)
            uniqueUserTags = list(userTagsSet - masterTags)
            existingUserTagsList = list(userTagsSet & masterTags)

            if uniqueUserTags:
                cur.execute("SELECT MAX(TagID) FROM Tags")
                maxtagid = cur.fetchone()
                start_id = (maxtagid[0] or 0) + 1
                nextTagIDsList = [start_id + i for i in range(len(uniqueUserTags))]
                cur.executemany("INSERT INTO Tags (TagID, TagLabel) VALUES (%s, %s)",
                                list(zip(nextTagIDsList, uniqueUserTags)))
                cardTagIDTuple = [(nextcardid, num) for num in nextTagIDsList]
                cur.executemany("INSERT INTO CardTags (CardID, TagID) VALUES (%s, %s)", cardTagIDTuple)

            if existingUserTagsList:
                data = tuple(existingUserTagsList)
                cur.execute("SELECT TagID FROM Tags WHERE TagLabel IN %s", (data,))
                results = cur.fetchall()
                existingUserTagID = [item[0] for item in results]
                cardTagIDTuple = [(nextcardid, num) for num in existingUserTagID]
                cur.executemany("INSERT INTO CardTags (CardID, TagID) VALUES (%s, %s)", cardTagIDTuple)

            print("Ready to commit TAGS to DB")
            enable_commits = True
        except Exception as e:
            print(f"[TAG ERROR] {e}")

    # Inserting Files to Database then Google Cloud (with compression)
    if files is not None:
        for file in files:
            enable_commits = False
            try:
                # Save uploaded file to temp path
                with tempfile.NamedTemporaryFile(delete=False) as tmp:
                    file.file.seek(0)
                    tmp.write(file.file.read())
                    tmp_path = tmp.name

                # Compress file into .zip
                zip_path = compress_file(tmp_path)
                zip_filename = os.path.basename(zip_path)
                filesizeNEW = os.path.getsize(zip_path)

                # Next FileID
                cur.execute("SELECT MAX(FileID) FROM Files")
                maxFileid = cur.fetchone()
                nextfileid = (maxFileid[0] or 0) + 1

                # Upload .zip to GCS
                blob_name = f"files/{nextfileid}_{uuid.uuid4().hex}_{zip_filename}"
                with open(zip_path, "rb") as fzip:
                    upload_ok = upload_to_bucket(blob_name, fzip, "application/zip", bucket_name)
                if not upload_ok:
                    raise HTTPException(status_code=500, detail="Failed to upload compressed file")

                # Build public URL
                public_url = f"https://storage.googleapis.com/{bucket_name}/{blob_name}"

                # Insert into DB (note file_extension is now .zip)
                cur.execute(
                            'INSERT INTO Files (fileid, CardID, filename, file_link, filesize, fileextension) VALUES (%s, %s, %s, %s, %s, %s)',
                            (nextfileid, nextcardid, f"{file.filename}.zip", public_url, filesizeNEW, ".zip")
                        )
                
                print(f"Ready to commit COMPRESSED FILE {file.filename} TO DB")
                enable_commits = True
            except Exception as e:
                conn.rollback()
                print(f"[FILE ERROR] {e}")
                raise HTTPException(status_code=500, detail="Error inserting file")
            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
                if os.path.exists(zip_path):
                    os.remove(zip_path)

    if enable_commits:
        conn.commit()
    else:
        print("Commit failed")

    return {"message": "Success", "cardID": nextcardid}



# ------------------------------------------------------------
# DEPRECATED LOCAL FS EXAMPLES (kept for reference)
# ------------------------------------------------------------
"""
# THESE TWO ENDPOINTS UPLOAD AND DOWNLOAD ARE MADE FOR WHEN THE BACKEND HAS A LOCAL FILE SYSTEM TO USE. 
# WE HAVE SWITCHED TO USE A CLOUD SERVICE TO STORE OUR FILES SO THESE ARE NOW DEPRICATED

@card_router.post("/uploadFile")
async def uploadFile(file: UploadFile = File(...)):
    #Im using os.path.join to make it cross-platform compatible
    #This will use the correct path separator for the platform as well 
    pc_folder_path = os.path.dirname(os.path.abspath(__file__))
    innerfolder = "savedFiles"
    folder_path = os.path.join(pc_folder_path, innerfolder)
    print(pc_folder_path, folder_path, innerfolder)

    #Makes sure the file name and extension are formatted correctly
    file_name, file_ext = file.filename.split(".")

    #folder_path = "savedfiles"  # Specifies the folder where I want to save the files
    os.makedirs(folder_path, exist_ok=True)  # Creates the folder if it doesn't exist
    file_path = os.path.join(folder_path, f"{file_name}.{file_ext}")
    
    print(file_path)
    #Should probably write to folder in chunks for larger files but that will come in time
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    return {"success": True, "file path": file_path, "message": "File Uploaded Successfully"}

Im working on implementing google cloud storage functionality to fastAPI backend endpoints. One endpoint I have is called download_file. I want this endpoint to retieve the file from my google cloud bucket and send it to the user to download on my react frontend. I have inlcuded my endpoint that I want you to work off of, this endpoint downloadFile current downloads the selected file to the users local file system and the google cloud code that I have that can retirieve files from my bucket. The issue Im having is that my current google cloud code only works with local files systems. I need you to adjust this code to work with my fastAPI endpoint.

@card_router.get("/downloadFile")
async def downloadFile(fileTitle: str):
    #Im using os.path.join to make it cross-platform compatible
    #This will use the correct path separator for the platform as well 
    folder_path = os.path.dirname(os.path.abspath(__file__))
    innerfolder = "savedFiles/"
    file_path = os.path.join(folder_path, innerfolder, fileTitle)
    #print(folder_path, innerfolder)
    #print(file_path)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return {"error": "File doesn't exist"}
"""