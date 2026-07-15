import fitz
import os

pdfs = [
    r"C:\Users\cheth\.gemini\antigravity-ide\brain\ab838af4-33a6-4e54-9b68-5a241e72b9c6\media__1784143314640.pdf",
    r"C:\Users\cheth\.gemini\antigravity-ide\brain\ab838af4-33a6-4e54-9b68-5a241e72b9c6\media__1784143314847.pdf"
]
output_dir = r"C:\Users\cheth\Documents\Bhumi\public\img\logos"
os.makedirs(output_dir, exist_ok=True)

count = 1
for pdf_path in pdfs:
    doc = fitz.open(pdf_path)
    for page_index in range(len(doc)):
        page = doc[page_index]
        image_list = page.get_images()
        
        for image_index, img in enumerate(image_list, start=1):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]
            
            image_name = f"logo_extracted_{count}.{image_ext}"
            with open(os.path.join(output_dir, image_name), "wb") as f:
                f.write(image_bytes)
            print(f"Extracted {image_name}")
            count += 1

print(f"Extracted {count-1} total images")
