
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
from google.cloud import storage #pip install google-cloud-storage
import psycopg2
import os


card_router = APIRouter()


#Google Cloud Access Code for UploadCard endpoint

# Connects to the google cloud account
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'ServiceKey_GoogleCloud.json'
# Creates a client object to interact with GCS
storage_client = storage.Client()
# Create a new bucket
bucket_name = 'cereo_data_bucket' # can't have spaces in bucket names or uppercase
bucket = storage_client.bucket(bucket_name)
# Check if the bucket already exists
if not bucket.exists():
   print("CREATING NEW BUCKET")
   bucket = storage_client.create_bucket(bucket, location='US')
# # Prints the bucket instance information
#print(vars(bucket))
#print("\n\n")
# Accessing the bucket
my_bucket = storage_client.get_bucket('cereo_data_bucket')
#print(vars(my_bucket))



#Delete Files from Google Cloud
def delete_from_bucket(blob_name):
   try:
       bucket = storage_client.get_bucket(bucket_name)
       blob = bucket.blob(blob_name)
       blob.delete()
       print(f"File:  {blob_name}  deleted.")
   except Exception as e:
       print(e)
       return

#Upload Files to Google Cloud
def upload_to_bucket(blob_name, file_obj, file_type, bucket_name):
 try:
     bucket = storage_client.get_bucket(bucket_name)
     blob = bucket.blob(blob_name)
     blob.content_type = file_type # Set the content type to the MIME type of the file
     blob.upload_from_file(file_obj)
     return True
 except Exception as e:
     print(e)
     return False





#This takes in the username and card title and deletes that card
@card_router.delete("/deleteCard")
async def deleteCard(username: str, title: str):
    if username is None or title is None:
        raise HTTPException(status_code=422, detail="Username and title must not be None")
    if not isinstance(username, str) or not isinstance(title, str):
        raise HTTPException(status_code=422, detail="Username and title must be strings")

    
    #print(username, title)
    cur.execute("SELECT Cards.CardID FROM Users JOIN Cards ON Users.UserID = Cards.UserID WHERE Users.Username = %s AND Cards.Title = %s", (username, title))
    cardID = cur.fetchone()[0]

    #This gets me the FileID, DirectoryPath values from db
    cur.execute("SELECT Files.FileID, Files.DirectoryPath FROM Cards JOIN Files ON Cards.CardID = Files.CardID WHERE Cards.CardID = %s", (cardID,))
    temp = cur.fetchall()
    if temp:
        fileID, directoryPath = temp[0]
        if fileID != None and directoryPath != None:
            #Deleting from Google Cloud
            fileTitle = str(fileID) + '/' + directoryPath
            delete_from_bucket(fileTitle)

    #Deleting the data from the Database
    cur.execute("DELETE FROM Files WHERE CardID = %s", (cardID,))
    cur.execute("DELETE FROM CardTags WHERE CardID = %s", (cardID,))
    cur.execute("DELETE FROM Cards WHERE CardID = %s", (cardID,))
    conn.commit()
    return {"Success": "The card is deleted"}



# Add a bookmark
@card_router.post("/bookmarkCard")
async def bookmark_card(username: str = Form(...), title: str = Form(...)):
    try:
        cur.execute("SELECT UserID FROM Users WHERE Username = %s", (username,))
        user_id = cur.fetchone()
        if not user_id:
            raise HTTPException(status_code=404, detail="User not found")

        cur.execute("SELECT CardID FROM Cards WHERE Title = %s", (title,))
        card_id = cur.fetchone()
        if not card_id:
            raise HTTPException(status_code=404, detail="Card not found")

        cur.execute("INSERT INTO Favorites (UserID, CardID) VALUES (%s, %s) ON CONFLICT DO NOTHING", (user_id[0], card_id[0]))
        conn.commit()
        return {"message": "Card bookmarked successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))







@card_router.get("/downloadFile")
async def downloadFile(fileID: int):

    #Query the DB for file information like directoryPath
    cur.execute("SELECT DirectoryPath FROM Files WHERE fileID = %s", (fileID,))
    result = cur.fetchone()
    if result is None:
        raise HTTPException(status_code=422, detail="File is not in the database")
        #return {"error": "File not found"}
    directoryPath = result[0]

    #Files are stored in google storage by this format to avoid overwriting duplicate data because users can submit a file with the same name but different contents so we use the unique values of FileID that is in the database: FileID/DirectoryPath
    #Apparently google storage can handle up to 5 trillion items in a single bucket so while this solution doesn't solve the problem this project wont ever meet that edge case
    #So i need to create that string so my download code can locate it
    fileTitle = str(fileID) + '/' + directoryPath

    #This retireves the file from google cloud and then sends the bytes to the users client as a file response
    blob = my_bucket.blob(fileTitle)
    if blob.exists():
        # Download the file from GCS to a BytesIO object
        file_content = BytesIO()
        storage_client.download_blob_to_file(blob, file_content)
        file_content.seek(0) # Go back to the start of the file
        return Response(file_content.read(), media_type="application/octet-stream", headers={"Content-Disposition": f"attachment; filename={directoryPath}"})
    return {"error": "File doesn't exist"}



@card_router.get("/allCards")
def allCards():
    try:
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
            GROUP BY Cards.CardID, Categories.CategoryLabel, Files.FileExtension, Files.FileID, Users.Username, Users.Email
            ORDER BY Cards.CardID DESC;
        """)

        rows = cur.fetchall()
        columns = ["username", "email", "title", "category", "date", "description", "org", "funding", "link", "tags", "latitude", "longitude", "fileEXT", "fileID"]
        data = [dict(zip(columns, row)) for row in rows]
        
        return {"data": data}
    except Exception as e:
        # Handle database errors gracefully
        print(f"An error occurred while fetching all cards: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")




@card_router.post("/uploadForm")
async def submit_form(
    name: str = Form(...),
    email: str = Form(...),
    title: str = Form(...),
    category: str = Form(...),
    description: Optional[str] = Form(None),
    funding: Optional[str] = Form(None),
    org: Optional[str] = Form(None),
    link: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    latitude: float = Form(...),
    longitude: float = Form(...),
    file: UploadFile = File(None)
):
    #The ... means that the input is required
    # print(f"name: {name}")
    # print(f"email: {email}")
    # print(f"title: {title}")
    # print(f"category: {category}")
    # print(f"description: {description}")
    # print(f"funding: {funding}")
    # print(f"org: {org}")
    # print(f"link: {link}")
    # print(f"tags: {tags}")
    # print(f"latitude: {latitude}")
    # print(f"longitude: {longitude}")
    #print(f"file: {file}")
    """
    This endpoint Submits a Card
    """

    #Inserting Card Data
    enable_commits = False


    #Get Max CardID from db
    cur.execute("SELECT MAX(CardID) FROM Cards")
    maxcardid = cur.fetchone()
    #print(maxcardid[0], (type(maxcardid[0])))
    nextcardid = maxcardid[0] + 1
    #print(nextcardid, (type(nextcardid)))

    #Get UserID of submitted card from db
    cur.execute("SELECT userID FROM Users WHERE username = %s AND email = %s", (name, email))
    userID = cur.fetchone()
    #print(userID, (type(userID)))

    #Convert category string to categoryID
    categoryID = 0
    if category == "River":
        categoryID = 1
    elif category == "Watershed":
        categoryID = 2
    elif category == "Places":
        categoryID = 3
    else:
        raise HTTPException(status_code=400, detail="Category is not a valid item")
    #print(category, categoryID)

    # Define schema limits for testing
    title_limit = 255
    latitude_limit = (10, 8)  # (total_digits, decimal_places)
    longitude_limit = (11, 8)
    description_limit = 2000
    organization_limit = 255
    funding_digits = 8
    funding_decimal = 2
    link_limit = 255

    #Testing the Data based on the schema
    if len(title) > title_limit:
        raise HTTPException(status_code=400, detail="Title exceeds 255 characters")

    try:
        if not (-90 <= latitude <= 90):
            raise HTTPException(status_code=400, detail="Latitude is out of bounds (-90 to 90)")
    except ValueError:
        raise HTTPException(status_code=400, detail="Latitude is not a valid decimal number")

    if len(str(latitude).split('.')[-1]) > latitude_limit[1]:
        raise HTTPException(status_code=400, detail=f"Latitude decimal places exceed {latitude_limit[1]}")

    try:
        if not (-180 <= longitude <= 180):
            raise HTTPException(status_code=400, detail="Longitude is out of bounds (-180 to 180)")
    except ValueError:
        raise HTTPException(status_code=400, detail="Longitude is not a valid decimal number")

    if len(str(longitude).split('.')[-1]) > longitude_limit[1]:
        raise HTTPException(status_code=400, detail=f"Longitude decimal places exceed {longitude_limit[1]}")

    if description != None:
        if len(description) > description_limit:
            raise HTTPException(status_code=400, detail="Description exceeds 2000 characters")

    if org != None:
        if len(org) > organization_limit:
            raise HTTPException(status_code=400, detail="Organization exceeds 255 characters")

    if funding is not None:
        if len(funding) > 255:  # Maximum length for VARCHAR(255)
            raise HTTPException(status_code=400, detail="Funding exceeds 255 characters")


    if link != None:
        if len(link) > link_limit:
            raise HTTPException(status_code=400, detail="Link exceeds 255 characters")

    print("Card Data Validated for CardID: ", nextcardid)



    #Order of operations for DB Insertions to not make schema mad
    #1st Card info
    #2nd Tag list
    #3rd CardTag Associations
    #4th Files


    # Inserting Card Data
    try:
        enable_commits = False
        insert_script = 'INSERT INTO Cards (CardID, UserID, Title, Latitude, Longitude, CategoryID, Description, Organization, Funding, Link) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)'
        insert_value = (nextcardid, userID[0], title, latitude, longitude, categoryID, description, org, funding, link)
        cur.execute(insert_script, insert_value)


        print("Ready to commit CARDS to DB")
        enable_commits = True

        #return {"message": "Data Card inserted successfully"}
    except psycopg2.DatabaseError as e:
        # Log the error for debugging
        print(f"Database Error: {e}")
        # Rollback the transaction
        conn.rollback()
        raise HTTPException(status_code=500, detail="An error occurred while inserting the data. Please try again later.")

    except Exception as e:
        # Handle other exceptions gracefully and log them
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while inserting the data. Please try again later.")



    # Inserting Unique Tag items if any
    if tags != None:
        enable_commits = False


        try:
            #seperating the tag list
            user_tags = tags.split(",")
            # Remove leading and trailing spaces from each word
            user_tags = [tag.strip() for tag in user_tags]
            """print("\nuser_tags:  ")
            print(user_tags)"""

            #Get the master list of custom tags from db
            cur.execute("SELECT TagLabel FROM Tags")
            all_tag_list = cur.fetchall()
            """print("\nall_tag_list:   ")
            print(all_tag_list)"""

            #Find unique tags from the submitted list
            # Convert all_tag_list to a set of strings
            masterTags = set(tag[0] for tag in all_tag_list)
            # Convert userTags to a set
            userTagsSet = set(user_tags)
            # Use set difference to remove common tags
            uniqueUserTags = userTagsSet - masterTags
            # Use set intersection to find common tags
            existingUserTags = userTagsSet & masterTags

            # Convert back to a list
            uniqueUserTagsList = list(uniqueUserTags)
            existingUserTagsList = list(existingUserTags)
            """
            print("\nuniqueUserTagList:    ")
            print(uniqueUserTagsList)
            print("\nexistingUserTagsList:   ")
            print(existingUserTagsList)
            """

            if uniqueUserTagsList != []:
                #Get the next tagID from db
                cur.execute("SELECT MAX(TagID) FROM Tags")
                maxtagid = cur.fetchone()

                #Creates the new tagIDS to insert to tag table
                nextTagIDsList = [maxtagid[0] + i + 1 for i in range(len(uniqueUserTagsList))]

                #Create the insert statement for the tags table
                tags_insert_statement_words = "INSERT INTO Tags (TagID, TagLabel) VALUES (%s, %s)"
                tags_insert_statement_data = list(zip(nextTagIDsList, uniqueUserTagsList))

                """print("\nnextTagIDsList:   ")
                print(nextTagIDsList)
                print("\ntags_insert_statement words:    ")
                print(tags_insert_statement_words)
                print("\ntags_insert_statement data:    ")
                print(tags_insert_statement_data)
                """

                #Insert to DB tags
                cur.executemany(tags_insert_statement_words, tags_insert_statement_data)   

                #Creates the tag query with cardID
                cardTagIDTuple = [(nextcardid, num) for num in nextTagIDsList]
                """print("\ncardTagIDTuple:    ")
                print(cardTagIDTuple)"""
                #Inserts into DB
                cardTags_insert_statement = "INSERT INTO CardTags (CardID, TagID) VALUES (%s, %s)"
                cur.executemany(cardTags_insert_statement, cardTagIDTuple)        


            # Creating CardTag assocaitions for new Card

            #Get the other half of non-unique taglabel ID's
            if existingUserTagsList != []:
                data = tuple(existingUserTagsList)
                query = "SELECT TagID FROM Tags WHERE TagLabel IN %s"
                cur.execute(query, (data,))
                results = cur.fetchall()
                #Fixes format from fetchall() so [(#,), (#,)] to [#, #]
                existingUserTagID = list(item[0] for item in results)
                """print(existingUserTagID)"""
                #Creates the tag query with cardID
                cardTagIDTuple = [(nextcardid, num) for num in existingUserTagID]
                """print(cardTagIDTuple)"""
                #Inserts into DB
                cardTags_insert_statement = "INSERT INTO CardTags (CardID, TagID) VALUES (%s, %s)"
                cur.executemany(cardTags_insert_statement, cardTagIDTuple)
                

                print("Ready to commit TAGS to DB")
                enable_commits = True
        except ValueError as e:
            # Handle the exception (ValueError in this case)
            print(f"Exception: {e}")
            print("Unable to try Tags. No comma found.")

    # Inserting File to Database then Google Cloud
    if file != None:
        enable_commits = False



        #Get info from file object
        directoryPathNEW = file.filename
        fileContent = file.content_type
        fileNameNEW, fileExtensionNEW = os.path.splitext(directoryPathNEW)
        if fileExtensionNEW:
            file_typeNEW = fileExtensionNEW[1:] # remove the leading dot
        else:
            file_typeNEW = "binary"
        filesizeNEW = file.size
        #print(fileNameNEW, directoryPathNEW, file_typeNEW.upper(), filesizeNEW, sep='\n')
            
        # Check if the file size is over 10 GB (10 * 1024 * 1024 * 1024 bytes)
        #This is an abritrary limit that I put in the size of file uploads so we can't have someone send in a terabyte and kill the backend
        max_size_bytes = 10 * 1024 * 1024 * 1024

        if filesizeNEW > max_size_bytes:
            raise HTTPException(status_code=413, detail="File size exceeds 10 GB. This is a limit that can be removed by the Living Atlas Devs if requested")


        #Get Max FileID from db
        cur.execute("SELECT MAX(FileID) FROM Files")
        maxFileid = cur.fetchone()
        nextfileid = maxFileid[0] + 1
        #print(maxFileid, nextfileid, sep=' -> ')

        try:
            insert_script = 'INSERT INTO Files (FileID, CardID, FileName, DirectoryPath, FileSize, FileExtension) VALUES (%s, %s, %s, %s, %s, %s)'
            insert_value = (nextfileid, nextcardid, fileNameNEW, directoryPathNEW, filesizeNEW, file_typeNEW.upper())
            cur.execute(insert_script, insert_value)
            
            print("Ready to commit FILES TO DB")
            enable_commits = True

            bucketFilePath = str(nextfileid) + '/' + directoryPathNEW
            #print(bucketFilePath)

            # If Added to the DB the file will be added to Google Cloud
            upload_to_bucket(bucketFilePath, file.file, fileContent, bucket_name)

            #return {"message": "Data Card inserted successfully"}
        except psycopg2.DatabaseError as e:
            # Log the error for debugging
            print(f"Database Error: {e}")
            # Rollback the transaction
            conn.rollback()
            raise HTTPException(status_code=500, detail="An error occurred while inserting the data. Please try again later.")
        except Exception as e:
            # Handle other exceptions gracefully and log them
            print(f"An unexpected error occurred in uploadFiles: {e}")
            raise HTTPException(status_code=500, detail="An error occurred while inserting the data. Please try again later.")


    if enable_commits == True:
        conn.commit()

    """
    I need the download button to toggle visability of the file 
    I need the download button to adjust the label to File.FileExtension
    I need /getall /adjustboundry /searchbar /filterbytag to return fileextension, fileID
    I need download to use fileID
    """





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
