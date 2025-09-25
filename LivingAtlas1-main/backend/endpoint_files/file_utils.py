import zipfile
import os

#I am currently putting this code here while i wait on clients response on how they want to procede with compression based on the research document I provided them.
#This current method just uses the .zip method to allow me to test everything else related to file upload until that decision is reached.

def compress_file(file_path: str) -> str:
    """
    Compress a single file into a .zip archive and return the zip path.
    """
    zip_path = f"{file_path}.zip"
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        zipf.write(file_path, arcname=os.path.basename(file_path))
    return zip_path


def decompress_file(zip_path: str, extract_to: str) -> str:
    """
    Extract a .zip archive and return the path to the first extracted file.
    """
    with zipfile.ZipFile(zip_path, 'r') as zipf:
        zipf.extractall(extract_to)
        extracted_files = zipf.namelist()
    return os.path.join(extract_to, extracted_files[0]) if extracted_files else None