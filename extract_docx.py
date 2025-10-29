import xml.etree.ElementTree as ET
import re

# Read the document.xml file
with open('temp_docx/word/document.xml', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract text between w:t tags
text_matches = re.findall(r'<w:t[^>]*>(.*?)</w:t>', content)
extracted_text = ' '.join(text_matches)

# Clean up and print
print(extracted_text)