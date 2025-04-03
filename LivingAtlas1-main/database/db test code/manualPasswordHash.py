import hashlib
import os

# Input values
username = "Zach"
email = "zachary.garoutte@wsu.edu"
password = "Awesomezg02$"  # replace with the password you want to use
pepper = "xe5Dx93xefx16x9ax12wy"

# Generate a 32-byte salt
salt = os.urandom(32)

# Hash the password + salt + pepper
hashed_password = hashlib.sha256(
    password.encode('utf-8') + salt + pepper.encode('utf-8')
).hexdigest()

# Format salt as bytea literal for Postgres
bytea_salt = f"\\x{salt.hex()}"

# Output the full SQL insert command
print("\nCopy and run this SQL insert command in psql:\n")
print(f"""INSERT INTO Users (UserID, Username, Email, HashedPassword, Salt)
VALUES (NEXTVAL('users_userid_seq'), '{username}', '{email}', '{hashed_password}', '{bytea_salt}');""")