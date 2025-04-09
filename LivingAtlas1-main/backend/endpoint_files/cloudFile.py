



"""
NOTES

This file is intended to be used to test my (Mitchell Kolb) skills/concepts with google cloud API.
This file serves no purpose in the functionality of the Living Atlas Backend
I just worked really hard to learn this stuff and don't wanna delete it lol cause Im proud I got it to work
If for whatever reason you want to get this file to work you have to copy the ServiceKey file that is outside of this folder into here because it needs to be at the same folder level.


"""














import os
from google.cloud import storage #pip install google-cloud-storage

"""
At the time of writing this I'm very new to using google cloud so these comments while I realize they are excessive are good for me to understand what is needed to use google cloud
"""

# Connects to the google cloud account
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'ServiceKey_GoogleCloud.json'

# Creates a client object to interact with GCS
storage_client = storage.Client()

# Create a new bucket
bucket_name = 'cereo_atlas_storage' # can't have spaces in bucket names or uppercase
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


#Upload Files
def upload_to_bucket(bLob_name, file_path, bucket_name):#blob_name is the foler + filename
    try:
        bucket = storage_client.get_bucket(bucket_name)
        blob = bucket.blob(bLob_name)
        blob.upload_from_filename(file_path)
        return True
    except Exception as e:
        print(e)
        return
file_path = r'/Users/mk/Desktop/LivingAtlas/LivingAtlas1/backend/app/savedFiles'
upload_to_bucket('pizzaBucket', os.path.join(file_path, 'pictureCard_fakeData.PNG'), bucket_name)
#upload_to_bucket('test/pizzaBucket', os.path.join(file_path, 'pizza.jpeg'), bucket_name)

#file_path = r'/Users/mk/Desktop'
#upload_to_bucket('testCSV', os.path.join(file_path, 'numbers.csv'), bucket_name)
"""
upload_to_bucket('THIS IS THE THE NAME OF THE THAT WILL BE SHOWN IN GOOGLE CLOUD', os.path.join(file_path, 'THE FILE AS IT CURRENTLY IS'), bucket_name)

"""





#Download Files
def download_from_bucket(bLob_name, file_path, bucket_name):#blob_name is object name
    try:
        bucket = storage_client.get_bucket(bucket_name)
        blob = bucket.blob(bLob_name)
        with open(file_path, 'wb') as f:
            storage_client.download_blob_to_file(blob, f)
        return True
    except Exception as e:
        print(e)
        return
#download_from_bucket('pizzaBucket', os.path.join(os.getcwd(), 'file1.jpeg'), bucket_name)
#download_from_bucket('test/pizzaBucket', os.path.join(os.getcwd(), 'file2.jpeg'), bucket_name)
#download_from_bucket('testCSV', os.path.join(file_path, 'file3.csv'), bucket_name)
"""
download_from_bucket('NAME OF THE FILE IN GOOGLE CLOUD', os.path.join(file_path, 'WHAT YOU WANT THE DOWNLOADED FILE TO BE NAMED AS'), bucket_name)
"""

#Delete Files
def delete_from_bucket(bucket_name):
   try:
       bucket = storage_client.get_bucket(bucket_name)
       blobs = bucket.list_blobs()
       print("Files in bucket:")
       for blob in blobs:
           print(blob.name)
       blob_name = input("Enter the name of the file you want to delete: ")
       blob = bucket.blob(blob_name)
       blob.delete()
       print(f"Blob {blob_name} deleted.")
   except Exception as e:
       print(e)
       return
#delete_from_bucket('cereo_data_bucket')

print("alldone")