import fitz
from PIL import Image, ImageChops
import os

pdfs = [
    (r"C:\Users\cheth\.gemini\antigravity-ide\brain\ab838af4-33a6-4e54-9b68-5a241e72b9c6\media__1784143314640.pdf", "logo_light_cropped.png"),
    (r"C:\Users\cheth\.gemini\antigravity-ide\brain\ab838af4-33a6-4e54-9b68-5a241e72b9c6\media__1784143314847.pdf", "logo_dark_cropped.png")
]
output_dir = r"C:\Users\cheth\Documents\Bhumi\public\img\logos"
os.makedirs(output_dir, exist_ok=True)

def trim(im):
    bg = Image.new(im.mode, im.size, im.getpixel((0,0)))
    diff = ImageChops.difference(im, bg)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    bbox = diff.getbbox()
    if bbox:
        return im.crop(bbox)
    return im

def make_transparent(im, bg_color):
    # Convert to RGBA
    im = im.convert("RGBA")
    data = im.getdata()
    new_data = []
    # Tolerance for background
    for item in data:
        if abs(item[0]-bg_color[0])<10 and abs(item[1]-bg_color[1])<10 and abs(item[2]-bg_color[2])<10:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    im.putdata(new_data)
    return im

for pdf_path, out_name in pdfs:
    doc = fitz.open(pdf_path)
    page = doc[0]
    mat = fitz.Matrix(4, 4)
    # Don't use alpha yet because the pdf has a hardcoded background color
    pix = page.get_pixmap(matrix=mat, alpha=False)
    temp_path = os.path.join(output_dir, "temp.png")
    pix.save(temp_path)
    
    # Open with PIL
    im = Image.open(temp_path)
    
    # Get corner pixel color
    bg_color = im.getpixel((0,0))
    
    # Crop borders
    cropped = trim(im)
    
    # Make background transparent
    transparent = make_transparent(cropped, bg_color)
    
    transparent.save(os.path.join(output_dir, out_name))
    print(f"Processed and cropped {out_name}")
    
if os.path.exists(temp_path):
    os.remove(temp_path)
