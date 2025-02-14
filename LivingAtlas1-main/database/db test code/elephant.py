import os
import urllib.parse as up
import psycopg2
import hashlib

def main():

    #up.uses_netloc.append("postgres")
    #url = up.urlparse(os.environ["postgres://lvssvjaq:Xc8L5cPmMIIheJuDgfZF52JKpNKt8p9q@mahmud.db.elephantsql.com/lvssvjaq"])

    connectionsucceeded = False

    try:
        #conn = psycopg2.connect(database=url.path[1:], user=url.username, password=url.password, host=url.hostname, port=url.port)
        conn = psycopg2.connect("dbname = 'lvssvjaq' user = 'lvssvjaq' host = 'mahmud.db.elephantsql.com' password = 'Xc8L5cPmMIIheJuDgfZF52JKpNKt8p9q'")
        connectionsucceeded = True

    except:
        print("Unable to connect to the database")

    if(connectionsucceeded):
        cur = conn.cursor()
        #Give users the option of logging in, creating account, or exiting
        selection = input("1. Log into account \n2. Create Account \n3. Exit\n")
        selection = int(selection)
        #Logging in
        if(selection == 1):
            #Enter username and password. These will be used the search the users table in the database
            username = input("Enter your username: ")
            password = input("Enter your password: ")
            #Encode and hash the entered password. This is because the passwords stored in the database are hashed.
            #Hashing is a one-way form of encryption. By hashing the provided password, the database matches the 
            #hashed given password with the one stored in the database
            hashpass = bytes(password, 'utf-8')
            password = hashlib.sha256(hashpass).hexdigest()
            #print(password)
            try: 
                #Select the uid from the database where the stored username and password hash match the given inputs
                cur.execute("SELECT uid FROM users WHERE username = (%s) AND hashedpassword = (%s)", ((username, password)))
                #The uid (username id) is merely just used for testing authentication in this program
                for record in cur:
                    #print("Test")
                    user_id = record[0]
                print("The user_id is", user_id)
                #If the query fails, give the reason why
            except Exception as e:
                print("Selection from users table failed:", e)
        #Creating account
        if(selection == 2):
            #Count how many users there are currently
            cur.execute("SELECT COUNT(uid) FROM users")
            for record in cur:
                user_id = record[0] + 1
            #Provide a username, password, and email
            username = input("Enter a username: ")
            email = input("Enter an email: ")
            password = input("Enter a password: ")
            #Encrypt and hash the password
            hashpass = bytes(password, 'utf-8')
            password = hashlib.sha256(hashpass).hexdigest()
            #print(password)
            try:
                #Insert the username, hashed password, email, and new user id into the database
                cur.execute("INSERT INTO users (uid, username, hashedpassword, email) VALUES (%s, %s, %s, %s)", ((user_id, username, password, email)))
                conn.commit()
            except Exception as e:
                #If the query fails, give the reason why
                print("Insert to users table failed:", e)
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()