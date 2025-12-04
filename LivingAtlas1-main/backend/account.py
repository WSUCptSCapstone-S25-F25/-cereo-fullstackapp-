"""
account
    profile account
    upload account
    profile cards           --Adjust query to be post referenced

"""

from fastapi import APIRouter, Form, HTTPException
from database import conn, cur
from pydantic import BaseModel

import urllib.parse
import requests

import os
import hashlib

# Email configuration - Use SendGrid for cloud deployment
import os


# SendGrid Email: wsu.cereoatlas26@gmail.com
# SendGrid Password: LivingAtlas25$
# SendGrid Recovery Code: 8W6JXAUWQZWSNVJXA4VH2CXV
# SendGrid API Key: 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

# SendGrid configuration
SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY", "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")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "wsu.cereoatlas26@gmail.com")

# SMTP_SERVER = "smtp.gmail.com"
# SMTP_PORT = 465
# SENDER_EMAIL = "cereofullstack@gmail.com"
# SENDER_PASSWORD = "ljun kiiz ngod ypjv"

account_router = APIRouter()

# Model for password reset
class ResetPasswordRequest(BaseModel):
    email: str
    new_password: str

# Model for forgot password request
class ForgotPasswordRequest(BaseModel):
    email: str

#Retrieve names and emails of all users for the administration page
class User(BaseModel):
    name: str
    email: str

# Function to get short URL using Bitly
def get_short_url(long_url):
    try:
        # Using Bitly's API with timeout
        BITLY_API_URL = "https://api-ssl.bitly.com/v4/shorten"
        headers = {"Authorization": "Bearer 9b023a4be0d1aa1f667eae09b3b7e959af52acf2", "Content-Type": "application/json"}
        data = {"long_url": long_url}
        response = requests.post(BITLY_API_URL, json=data, headers=headers, timeout=10)
        if response.status_code == 200 or response.status_code == 201:
            return response.json()["link"]
        else:
            print("Error shortening URL:", response.text)
            return long_url  # Fallback to long URL
    except requests.Timeout:
        print("Bitly API timeout - using long URL")
        return long_url
    except Exception as e:
        print(f"Bitly API error: {e} - using long URL")
        return long_url

# Helper function to send the recovery email using SendGrid
def send_recovery_email(recipient_email):
    try:
        print(f"DEBUG: Preparing to send email to {recipient_email}...")

        # Construct the long URL with the recipient's email
        encoded_email = urllib.parse.quote(recipient_email)
        long_url = f"https://willowy-twilight-157839.netlify.app/reset-password?email={encoded_email}"
        
        print(f"DEBUG: Getting short URL for {long_url}")
        # Get a short URL from the dynamic URL shortener (e.g., Bitly)
        short_reset_url = get_short_url(long_url)
        print(f"DEBUG: Short URL obtained: {short_reset_url}")

        # Email content
        subject = "Password Reset Request"
        body = f"""
        <html>
            <body>
                <p>Hi,<br><br>
                You requested a password reset. Click the link below to reset your password:<br><br>
                <a href="{short_reset_url}">Reset Password</a><br><br>
                If you did not request this, please ignore this email.
                </p>
            </body>
        </html>
        """

        # Send via SendGrid
        print(f"DEBUG: Attempting to send via SendGrid...")
        if send_via_sendgrid(recipient_email, subject, body):
            print(f"DEBUG: SendGrid email sent successfully to {recipient_email}!")
            return
        else:
            raise Exception("SendGrid email sending failed")

    except Exception as e:
        print(f"DEBUG: Failed to send email: {e}")
        raise Exception(f"Email sending failed: {e}")

def send_via_sendgrid(recipient_email, subject, body):
    """Send email using SendGrid API"""
    try:
        print("DEBUG: Sending via SendGrid API...")
        
        payload = {
            "personalizations": [
                {
                    "to": [{"email": recipient_email}],
                    "subject": subject
                }
            ],
            "from": {"email": SENDER_EMAIL, "name": "Living Atlas"},
            "content": [
                {
                    "type": "text/html",
                    "value": body
                }
            ]
        }
        
        headers = {
            "Authorization": f"Bearer {SENDGRID_API_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(
            "https://api.sendgrid.com/v3/mail/send",
            json=payload,
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 202:
            print(f"DEBUG: SendGrid email sent successfully!")
            return True
        else:
            print(f"DEBUG: SendGrid failed with status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"DEBUG: SendGrid error: {e}")
        return False


# Helper function to hash the password (same as current setup)
def hash_password(password: str, salt: bytes) -> str:
    pepper = bytes("xe5Dx93xefx16x9ax12wy", 'utf-8')
    return hashlib.sha256(bytes(password, 'utf-8') + salt + pepper).hexdigest()

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

# Forgot password endpoint
@account_router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    try:
        print(f"DEBUG: Processing forgot password request for {request.email}")
        
        # Check if the email exists in the database
        cur.execute("SELECT userid FROM users WHERE email = %s", (request.email,))
        user = cur.fetchone()

        if not user:
            print(f"DEBUG: Email not found: {request.email}")
            raise HTTPException(status_code=400, detail="Email not found")

        print(f"DEBUG: Email found, sending recovery email to {request.email}")
        
        # Send the recovery email
        send_recovery_email(request.email)

        print(f"DEBUG: Recovery email process completed for {request.email}")
        return {"success": True, "message": "Password recovery email sent."}

    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: Exception in forgot_password: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send recovery email: {str(e)}")

# Reset password endpoint
@account_router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    try:
        print(f"DEBUG: Processing reset password request")
        
        # Extract email and new_password from the request
        email = request.email
        new_password = request.new_password
        
        print(f"DEBUG: Email: {email}")
        print(f"DEBUG: New password length: {len(new_password) if new_password else 0}")

        if not email or not new_password:
            print(f"DEBUG: Missing email or password")
            raise HTTPException(status_code=400, detail="Email and password are required")

        # Check if the email exists in the database
        print(f"DEBUG: Checking if email exists in database...")
        cur.execute("SELECT userid FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        print(f"DEBUG: User found: {user is not None}")

        if not user:
            print(f"DEBUG: Email not found in database: {email}")
            raise HTTPException(status_code=400, detail="Invalid email")

        # Generate a new salt for the new password
        print(f"DEBUG: Generating new salt and hashing password...")
        new_salt = os.urandom(32)

        # Hash the new password with the new salt
        hashed_password = hash_password(new_password, new_salt)
        print(f"DEBUG: Password hashed successfully")

        # Update the password and salt in the database
        print(f"DEBUG: Updating password in database...")
        cur.execute(
            "UPDATE users SET hashedpassword = %s, salt = %s WHERE email = %s",
            (hashed_password, new_salt, email)
        )
        conn.commit()
        print(f"DEBUG: Password updated successfully for {email}")

        return {"success": True, "message": "Password has been reset successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: Exception in reset_password: {str(e)}")
        import traceback
        print(f"DEBUG: Full traceback: {traceback.format_exc()}")
        return {"success": False, "message": str(e)}

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
                        'fileID', f.FileID,
                        'filename', f.FileName,
                        'fileLink', f.FileLink,
                        'fileEXT', f.FileExtension
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
        WHERE u.Username = %s
        GROUP BY c.CardID, cat.CategoryLabel, u.Username, u.Email, c.Thumbnail_Link
        ORDER BY c.CardID DESC;
    """, (username,))

    rows = cur.fetchall()
    columns = [
        "username", "email", "title", "category", "date", "description", "org",
        "funding", "link", "tags", "latitude", "longitude", "thumbnail_link", "files"
    ]
    data = [dict(zip(columns, row)) for row in rows]
    return {"data": data}


