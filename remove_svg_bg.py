import os
import re

svg_dir = r"C:\Users\cheth\Documents\Bhumi\public\img\logos"
for filename in os.listdir(svg_dir):
    if filename.endswith(".svg"):
        filepath = os.path.join(svg_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = re.sub(r'(<svg[^>]*>\s*)<rect[^>]*>', r'\1', content, count=1)
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Removed background from {filename}")
        else:
            print(f"No background rect found in {filename}")
