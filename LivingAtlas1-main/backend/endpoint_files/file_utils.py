import zipfile
import lzma
import os
import tempfile
import shutil

#I am currently putting this code here while i wait on clients response on how they want to procede with compression based on the research document I provided them.
#This current method just uses the .zip method to allow me to test everything else related to file upload until that decision is reached.

import os
import zipfile
import tempfile
import shutil

def compress_file(input_path: str, original_name: str = None) -> str:
    """
    Compress a file or directory into a .zip archive.
    - If input_path is already a .zip, returns it unchanged.
    - If input_path is a single file, creates a folder named after the file (no extension)
      and zips that folder, so the extracted result preserves its name and extension.
    - If input_path is a directory, zips it recursively.
    - Returns the path to the created .zip file.
    """
    import zipfile, os, tempfile, shutil

    # If already a zip file, skip re-zipping
    if input_path.lower().endswith(".zip"):
        return input_path

    # Derive clean base name (without extension)
    base_display_name = os.path.splitext(original_name or os.path.basename(input_path))[0]
    zip_output_path = os.path.join(tempfile.gettempdir(), f"{base_display_name}.zip")

    # Case 1: Single file upload
    if os.path.isfile(input_path):
        folder_name = base_display_name
        temp_dir = os.path.join(tempfile.gettempdir(), folder_name)
        os.makedirs(temp_dir, exist_ok=True)

        # Rename the temp file inside the folder to the original filename
        target_path = os.path.join(temp_dir, original_name or os.path.basename(input_path))
        shutil.copy2(input_path, target_path)

        with zipfile.ZipFile(zip_output_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            zipf.write(target_path, arcname=os.path.basename(target_path))

        shutil.rmtree(temp_dir, ignore_errors=True)

    # Case 2: Directory input
    elif os.path.isdir(input_path):
        with zipfile.ZipFile(zip_output_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for root, _, files in os.walk(input_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, input_path)
                    zipf.write(file_path, arcname)
    else:
        raise ValueError(f"compress_file() expected file or directory, got invalid path: {input_path}")

    return zip_output_path

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