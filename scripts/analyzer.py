import sys
import os
import json
import nltk
from deep_translator import GoogleTranslator
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

# Set NLTK data path to a local project directory
nltk_data_path = os.path.join(os.getcwd(), 'nltk_data')
os.makedirs(nltk_data_path, exist_ok=True)
nltk.data.path.append(nltk_data_path)

def send_progress(status):
    """Send a progress marker to stdout to be consumed by the streaming API."""
    print(json.dumps({"status": status}), flush=True)

def download_nltk():
    """Ensure required NLTK datasets are downloaded locally."""
    for package in ['punkt', 'stopwords', 'wordnet', 'punkt_tab']:
        try:
            nltk.data.find(f'tokenizers/{package}' if 'punkt' in package else f'corpora/{package}')
        except LookupError:
            nltk.download(package, download_dir=nltk_data_path, quiet=True)

download_nltk()

def translate_long_text(text, max_chars=4500):
    """Translate text from Indonesian to English in chunks to respect API limits."""
    translator = GoogleTranslator(source="id", target="en")
    if not text.strip():
        return ""
    
    # Sanitize
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

def preprocess_text(text, stop_words, lemmatizer):
    """Clean and lemmatize text for TF-IDF processing."""
    tokens = nltk.word_tokenize(text.lower())
    tokens = [lemmatizer.lemmatize(token) for token in tokens if token.isalpha() and token not in stop_words]
    return " ".join(tokens)

def main():
    # =========================================================
    # 1. Data Ingestion — only reads client input from stdin
    # =========================================================
    send_progress("INGESTION")

    try:
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"error": "No input text provided"}))
            return
        # Sanitize client input
        client_text_id = input_data.strip()
        client_text_id = "".join(c for c in client_text_id if c.isprintable() or c.isspace())
        client_text_id = client_text_id.encode('utf-8', 'ignore').decode('utf-8')
    except Exception as e:
        print(json.dumps({"error": f"Failed to read input: {str(e)}"}))
        return

    # Load pre-extracted & pre-translated domain data from cache
    DOMAIN_DIR = os.path.join(os.getcwd(), 'public', 'uploads', 'certifications')
    CACHE_FILE = os.path.join(DOMAIN_DIR, 'domain_cache.json')
    
    if not os.path.exists(CACHE_FILE):
        print(json.dumps({"error": "Domain cache belum tersedia. Silakan unggah file sertifikasi melalui halaman Admin terlebih dahulu."}))
        return

    with open(CACHE_FILE, 'r', encoding='utf-8') as f:
        domain_cache = json.load(f)
    
    if not domain_cache:
        print(json.dumps({"error": "Cache kosong. Silakan unggah file sertifikasi melalui halaman Admin."}))
        return

    domain_names = list(domain_cache.keys())
    
    # Check if cache has pre-translated data (new format) or raw-only (old format)
    first_value = list(domain_cache.values())[0]
    if isinstance(first_value, dict) and "translated" in first_value:
        # New format: {filename: {raw: "...", translated: "..."}}
        domains_en = [
            "".join(c for c in entry["translated"] if c.isprintable() or c.isspace()).encode('utf-8', 'ignore').decode('utf-8')
            for entry in domain_cache.values()
        ]
        domains_already_translated = True
    else:
        # Old format: {filename: "raw text..."}
        domains_raw = [
            "".join(c for c in text if c.isprintable() or c.isspace()).encode('utf-8', 'ignore').decode('utf-8')
            for text in domain_cache.values()
        ]
        domains_already_translated = False

    # =========================================================
    # 2. Translation Process — only translate CLIENT text
    #    Domain texts are already translated in the cache
    # =========================================================
    send_progress("TRANSLATION")
    try:
        client_text_en = translate_long_text(client_text_id)
        
        # Only translate domains if cache doesn't have translations yet
        if not domains_already_translated:
            domains_en = [translate_long_text(text) for text in domains_raw]
    except Exception as e:
        print(json.dumps({"error": f"Translation failed: {str(e)}"}))
        return

    # =========================================================
    # 3. Text Preprocessing (Stopwords & Lemmatization)
    # =========================================================
    send_progress("PREPROCESSING")
    stop_words = set(stopwords.words("english"))
    lemmatizer = WordNetLemmatizer()
    domains_tfidf_ready = [preprocess_text(d, stop_words, lemmatizer) for d in domains_en]
    client_tfidf_ready = preprocess_text(client_text_en, stop_words, lemmatizer)

    # =========================================================
    # 4. Feature Extraction – TF-IDF (Numeric)
    # =========================================================
    send_progress("TFIDF_VECTOR")
    tfidf_vectorizer = TfidfVectorizer()
    try:
        all_docs = domains_tfidf_ready + [client_tfidf_ready]
        tfidf_matrix = tfidf_vectorizer.fit_transform(all_docs)
    except Exception as e:
        print(json.dumps({"error": f"TF-IDF failed: {str(e)}"}))
        return

    # =========================================================
    # 5. Numeric Similarity Computation (Cosine Similarity)
    # =========================================================
    send_progress("TFIDF_SIM")
    try:
        numeric_scores = cosine_similarity(tfidf_matrix[-1], tfidf_matrix[:-1])[0]
    except Exception as e:
        print(json.dumps({"error": f"Numeric similarity failed: {str(e)}"}))
        return

    # =========================================================
    # 6. Feature Extraction – Semantic Embedding
    # =========================================================
    send_progress("SEMANTIC_EMBED")
    try:
        model = SentenceTransformer("all-MiniLM-L6-v2")
        domain_embeddings = model.encode(domains_en, convert_to_numpy=True)
        client_embedding = model.encode(client_text_en, convert_to_numpy=True)
    except Exception as e:
        print(json.dumps({"error": f"Semantic embedding failed: {str(e)}"}))
        return

    # =========================================================
    # 7. Semantic Similarity Computation (Cosine Similarity)
    # =========================================================
    send_progress("SEMANTIC_SIM")
    try:
        semantic_scores = cosine_similarity([client_embedding], domain_embeddings)[0]
    except Exception as e:
        print(json.dumps({"error": f"Semantic similarity failed: {str(e)}"}))
        return

    # =========================================================
    # 8. Score Integration (Weighted Scoring)
    # =========================================================
    send_progress("WEIGHTING")
    results = []
    for i in range(len(domain_names)):
        final_score = (0.5 * semantic_scores[i]) + (0.5 * numeric_scores[i])
        display_name = domain_names[i].replace('.pdf', '').replace('_', ' ')
        
        results.append({
            "name": display_name,
            "semanticScore": float(round(semantic_scores[i] * 100, 2)),
            "numericScore": float(round(numeric_scores[i] * 100, 2)),
            "matchScore": float(round(final_score * 100, 2)),
            "category": "Certification", 
            "institution": "Certiport"
        })

    # =========================================================
    # 9. Ranking & Recommendation
    # =========================================================
    send_progress("RANKING")
    results = sorted(results, key=lambda x: x["matchScore"], reverse=True)
    
    # Send final results
    print(json.dumps({"results": results}))

if __name__ == "__main__":
    main()
