import hashlib
import os

def generate_admin_user_sql(username, email, password):
    # Generate 32-byte salt
    salt = os.urandom(32)

    # Define hardcoded pepper (should match your backend)
    pepper = b"xe5Dx93xefx16x9ax12wy"

    # Hash the password using SHA-256 with salt + pepper
    hashpass = hashlib.sha256(password.encode('utf-8') + salt + pepper).hexdigest()

    # Format salt for PostgreSQL (hex representation)
    salt_hex = "\\x" + salt.hex()

    print("\nUse the following SQL command to insert an admin user:\n")
    print(f"""INSERT INTO users (userid, username, email, hashedpassword, salt, is_admin)
VALUES (NEXTVAL('users_userid_seq'), '{username}', '{email}', '{hashpass}', '{salt_hex}', TRUE);""")


generate_admin_user_sql(
    username="Jan Boll",
    email="j.boll@wsu.edu",
    password="1234C5"
)