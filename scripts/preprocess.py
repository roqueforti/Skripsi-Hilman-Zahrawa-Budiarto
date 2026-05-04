"""
Pre-extraction & translation script for domain certification PDFs.
Extracts text, sanitizes, and translates all PDFs to English.
Saves both raw and translated text to a JSON cache.
This runs automatically when admin uploads or deletes files.
"""
import os
import sys
import json
import glob
import pdfplumber
import nltk

# Set NLTK data path
nltk_data_path = os.path.join(os.getcwd(), 'nltk_data')
os.makedirs(nltk_data_path, exist_ok=True)
nltk.data.path.append(nltk_data_path)

for package in ['punkt', 'punkt_tab']:
    try:
        nltk.data.find(f'tokenizers/{package}')
    except LookupError:
        nltk.download(package, download_dir=nltk_data_path, quiet=True)

from deep_translator import GoogleTranslator

DOMAIN_DIR = os.path.join(os.getcwd(), 'public', 'uploads', 'certifications')
CACHE_FILE = os.path.join(DOMAIN_DIR, 'domain_cache.json')

def extract_text_from_pdf(pdf_path):
    """Extract all text content from a PDF file and sanitize illegal characters."""
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    sanitized_text = "".join(c for c in page_text if c.isprintable() or c.isspace())
                    text += sanitized_text + " "
    except Exception as e:
        print(f"Warning: Could not extract {pdf_path}: {e}", file=sys.stderr)
    return text.encode('utf-8', 'ignore').decode('utf-8').strip()

def translate_long_text(text, max_chars=4500):
    """Translate text from Indonesian to English in chunks."""
    translator = GoogleTranslator(source="id", target="en")
    if not text.strip():
        return ""
    
    # Sanitize before translating
    text = "".join(c for c in text if c.isprintable() or c.isspace())
    text = text.encode('utf-8', 'ignore').decode('utf-8')
    
    if len(text) <= max_chars:
        return translator.translate(text)
    
    chunks = []
    current_chunk = ""
    sentences = nltk.sent_tokenize(text)
    for sentence in sentences:
        if len(current_chunk) + len(sentence) + 1 <= max_chars:
            current_chunk += sentence + " "
        else:
            if current_chunk:
                chunks.append(translator.translate(current_chunk.strip()))
            current_chunk = sentence + " "
    if current_chunk:
        chunks.append(translator.translate(current_chunk.strip()))
    return " ".join(chunks)

def main():
    if not os.path.exists(DOMAIN_DIR):
        os.makedirs(DOMAIN_DIR, exist_ok=True)

    domain_files = glob.glob(os.path.join(DOMAIN_DIR, "*.pdf"))
    
    # Load existing cache to avoid re-translating unchanged files
    existing_cache = {}
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                existing_cache = json.load(f)
        except:
            existing_cache = {}

    cache = {}
    total = len(domain_files)
    
    for idx, file in enumerate(domain_files, 1):
        filename = os.path.basename(file)
        
        # Check if file already has a translated version in cache
        if filename in existing_cache and "translated" in existing_cache[filename]:
            print(f"[{idx}/{total}] Cached: {filename}")
            cache[filename] = existing_cache[filename]
            continue
        
        # Extract text
        raw_text = extract_text_from_pdf(file)
        if not raw_text:
            print(f"[{idx}/{total}] SKIP (empty): {filename}")
            continue
        
        # Translate
        print(f"[{idx}/{total}] Translating: {filename}...", end=" ", flush=True)
        try:
            translated_text = translate_long_text(raw_text)
            print(f"OK ({len(translated_text)} chars)")
        except Exception as e:
            print(f"FAIL: {e}")
            translated_text = raw_text  # Fallback to raw text
        
        cache[filename] = {
            "raw": raw_text,
            "translated": translated_text
        }
    
    with open(CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(cache, f, ensure_ascii=False)
    
    translated_count = sum(1 for v in cache.values() if isinstance(v, dict) and "translated" in v)
    print(f"\nCache saved: {len(cache)} files ({translated_count} translated) -> {CACHE_FILE}")

if __name__ == "__main__":
    main()
