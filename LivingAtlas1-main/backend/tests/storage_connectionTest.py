import os
from google.cloud import storage
from datetime import timedelta

# Path to credentials
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '../ServiceKey_GoogleCloud.json'

# Storage settings
bucket_name = "cereo_atlas_storage"  # <-- change if needed
file_name = "test_upload.txt"
upload_content = "This is a test file for verifying Google Cloud Storage connection."

try:
    # Create the client and bucket
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)

    # Upload the test file
    blob = bucket.blob(file_name)
    blob.upload_from_string(upload_content, content_type='text/plain')

    # Generate a signed URL valid for 15 minutes
    url = blob.generate_signed_url(version="v4", expiration=timedelta(minutes=15), method="GET")

    print(f"Upload succeeded! Temporary access URL:\n{url}")

except Exception as e:
    print(f"Failed to connect or upload: {e}")