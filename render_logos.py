import fitz
import os

pdfs = [
    (r"C:\Users\cheth\.gemini\antigravity-ide\brain\ab838af4-33a6-4e54-9b68-5a241e72b9c6\media__1784143314640.pdf", "logo_light.png"),
    (r"C:\Users\cheth\.gemini\antigravity-ide\brain\ab838af4-33a6-4e54-9b68-5a241e72b9c6\media__1784143314847.pdf", "logo_dark.png")
]
output_dir = r"C:\Users\cheth\Documents\Bhumi\public\img\logos"
os.makedirs(output_dir, exist_ok=True)

# Render the page to a transparent PNG
for pdf_path, out_name in pdfs:
    doc = fitz.open(pdf_path)
    page = doc[0]
    # Set zoom to 4 for high resolution
    mat = fitz.Matrix(4, 4)
    # Render page to a pixmap
    pix = page.get_pixmap(matrix=mat, alpha=True)
    
    # Save the pixmap
    pix.save(os.path.join(output_dir, out_name))
    print(f"Rendered {out_name}")
