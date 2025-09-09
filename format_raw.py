import os
from PIL import Image
import imagehash
import shutil

# For every image in ./raw_images, get the pHash and replace the file name with the hash. 
# moves image to ./gallery

# Paths
raw_dir = './raw_images'
gallery_dir = './gallery'

# Make sure the gallery directory exists
os.makedirs(gallery_dir, exist_ok=True)

# Supported image extensions
image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'}

# Process each file in raw_images
for filename in os.listdir(raw_dir):
    file_path = os.path.join(raw_dir, filename)
    name, ext = os.path.splitext(filename)
    ext = ext.lower()

    if ext not in image_extensions:
        print(f"Skipping non-image file: {filename}")
        continue

    try:
        with Image.open(file_path) as img:
            # consistent mode to avoid hash inconsistencies
            img = img.convert('RGB')
            phash = str(imagehash.phash(img))
            new_filename = f"{phash}{ext}"
            new_path = os.path.join(gallery_dir, new_filename)

            # Avoid overwriting existing images
            if os.path.exists(new_path):
                print(f"File already exists: {new_filename}, skipping.")
            else:
                shutil.move(file_path, new_path)
                print(f"Moved: {filename} → {new_filename}")
    except Exception as e:
        print(f"Error processing {filename}: {e}")
