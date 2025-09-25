import zipfile
import lzma
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

# ----------------------------
# XZ Compression (future-proof with optional encryption)
# ----------------------------
def compress_file_xz(file_path: str, preset: int = 6) -> str:
    """
    Compress a single file into a .xz archive and return the xz path.
    Preset range: 0 (fastest) to 9 (highest compression).
    """
    xz_path = f"{file_path}.xz"
    with open(file_path, "rb") as input_f, lzma.open(xz_path, "wb", preset=preset) as output_f:
        output_f.write(input_f.read())
    return xz_path


def decompress_file_xz(xz_path: str, output_path: str) -> str:
    """
    Decompress a .xz archive to the given output_path.
    Returns the path to the decompressed file.
    """
    with lzma.open(xz_path, "rb") as input_f, open(output_path, "wb") as output_f:
        output_f.write(input_f.read())
    return output_path