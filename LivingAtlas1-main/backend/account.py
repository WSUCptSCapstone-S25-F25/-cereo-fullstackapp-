"""
account
    profile account
    upload account
    profile cards           --Adjust query to be post referenced

"""

from fastapi import APIRouter, Form
from database import conn, cur
from pydantic import BaseModel

import os
import hashlib


account_router = APIRouter()

#Retrieve names and emails of all users for the administration page
class User(BaseModel):
    name: str
    email: str
@account_router.post("/list_database")
async def list_database():
    try:
        # Query the database to retrieve the names, emails, and Is_Admin status of all users
        cur.execute("SELECT username, email, COALESCE(is_admin, false) FROM users")
        rows = cur.fetchall()

        # Convert the query result into a list of dictionaries
        users = [{"name": row[0], "email": row[1], "is_admin": row[2]} for row in rows]
        

        return {"users": users}
    except Exception as e:
        return {"error": str(e)}



# Define a dependency to get the current user's role
@account_router.get("/userRole")
def get_user_role(email: str):
    try:
        # Query the database to retrieve the is_admin status of the user with the given email
        cur.execute(f"SELECT is_admin FROM users WHERE email = '{email}'")
        row = cur.fetchone()  # Assuming only one row per user
    
        if row:
            is_admin = row[0]
            return {"is_admin": is_admin}
        else:
            return {"error": "User not found"}
    except Exception as e:
        return {"error": str(e)}



# Define the edit_user_role endpoint
@account_router.post("/edit_user_role")
async def edit_user_role(user_info: dict):
    try:
        email = user_info.get('email')
        is_admin = user_info.get('is_admin')

        # Update the is_admin status of the user with the provided email
        cur.execute("UPDATE Users SET is_admin = %s WHERE email = %s", (is_admin, email))
        conn.commit()  # Commit the transaction
        
        return {"message": f"User role updated successfully."}
    except Exception as e:
        return {"error": str(e)}



# Define the delete_user endpoint
@account_router.post("/delete_user/{email}")
async def delete_user(email: str):
    try:
        # Query the database to get the role of the user with the provided email
        cur.execute("SELECT is_admin FROM Users WHERE email = %s", (email,))
        row = cur.fetchone()
        
        if row is None:
            return {"error": "User not found"}
        
        is_admin = row[0]
        
        if is_admin:
            return {"error": "Admin users cannot be deleted"}
        
        # Execute SQL query to delete the user with the provided email
        cur.execute("DELETE FROM Users WHERE email = %s", (email,))
        conn.commit()  # Commit the transaction
        
        return {"message": f"User with email '{email}' has been deleted successfully."}
    except Exception as e:
        return {"error": str(e)}





#This takes the users email and password and then returns the account information to show for the profile page
@account_router.get("/profileAccount")
def profileAccount(email: str, password: str):
    #Get the salt from the db
    cur.execute(f"SELECT salt FROM users WHERE email = '{email}'")
    rows = cur.fetchall()
    if rows != []:
        #Convert the given password and the pepper (which is hardcoded) into bytes, concatenate the password, salt, and pepper together
        #Hash all of that so that it matches the password stored in the db
        password = hashlib.sha256(bytes(password, 'utf-8') + rows[0][0] + bytes("xe5Dx93xefx16x9ax12wy", 'utf-8')).hexdigest()
        #Retrieve the information after the user has been authenticated
        cur.execute(f"SELECT username, email FROM users WHERE email = '{email}' AND hashedpassword = '{password}'")
        rows = cur.fetchall()
        return {"Account Information": rows}




@account_router.post("/uploadAccount")
async def make_account(
    name: str = Form(None),
    email: str = Form(None),
    password: str = Form(None)
):
    try:
        if name and email and password:
            # Check if email already exists
            cur.execute(f"SELECT userid FROM users WHERE email = '{email}'")
            if cur.fetchone():
                return {"success": False, "message": "Email must be unique"}
            
            # Get the maximum existing user ID and increment it
            cur.execute("SELECT MAX(userid) FROM users")
            max_userid = cur.fetchone()[0] or 0
            userid = max_userid + 1
            
            salt = os.urandom(32)
            hashpass = hashlib.sha256(bytes(password, 'utf-8') + salt + bytes("xe5Dx93xefx16x9ax12wy", 'utf-8')).hexdigest()
            cur.execute("INSERT INTO users (userid, username, hashedpassword, email, salt) VALUES (%s, %s, %s, %s, %s)", (userid, name, hashpass, email, salt))
            conn.commit()
            return {"success": True, "message": "New account added successfully"}
        else:
            return {"success": False, "message": "All fields must be filled in"}
    except Exception as e:
        return {"success": False, "message": str(e)}




@account_router.get("/profileCards")
def profileCards(username: str):
    cur.execute("""
        SELECT Users.Username, Users.Email, Cards.title, Categories.CategoryLabel, Cards.dateposted,
               Cards.description, Cards.organization, Cards.funding, Cards.link,
               STRING_AGG(Tags.TagLabel, ', ') AS TagLabels,
               Cards.latitude, Cards.longitude,
               Cards.thumbnail_link,  -- added
               Files.FileExtension, Files.FileID
        FROM Cards
        INNER JOIN Categories ON Cards.CategoryID = Categories.CategoryID
        LEFT JOIN Files ON Cards.CardID = Files.CardID
        LEFT JOIN CardTags ON Cards.CardID = CardTags.CardID
        LEFT JOIN Tags ON CardTags.TagID = Tags.TagID
        INNER JOIN Users ON Cards.UserID = Users.UserID
        WHERE Users.Username = %s
        GROUP BY Cards.CardID, Categories.CategoryLabel, Files.FileExtension, Files.FileID,
                 Users.Username, Users.Email, Cards.thumbnail_link  -- added to GROUP BY
        ORDER BY Cards.CardID DESC;
    """, (username,))

    columns = [
        "username", "email", "title", "category", "date", "description", "org", "funding", "link",
        "tags", "latitude", "longitude", "thumbnail_link",  # added here
        "fileEXT", "fileID"
    ]

    rows = cur.fetchall()
    data = [dict(zip(columns, row)) for row in rows]
    return {"data": data}


