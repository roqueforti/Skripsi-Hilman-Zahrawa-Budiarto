from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Union
import os
import json
import nltk
from deep_translator import GoogleTranslator
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

app = FastAPI(title="CertiMatch NLP Backend")

# Setup NLTK data
nltk_data_path = os.path.join(os.getcwd(), 'nltk_data_api')
os.makedirs(nltk_data_path, exist_ok=True)
nltk.data.path.append(nltk_data_path)

def download_nltk():
    for package in ['punkt', 'stopwords', 'wordnet', 'punkt_tab']:
        try:
            nltk.data.find(f'tokenizers/{package}' if 'punkt' in package else f'corpora/{package}')
        except LookupError:
            nltk.download(package, download_dir=nltk_data_path, quiet=True)

download_nltk()

# Load Model
model = SentenceTransformer("all-MiniLM-L6-v2")
stop_words = set(stopwords.words("english"))
lemmatizer = WordNetLemmatizer()

class AnalyzeRequest(BaseModel):
    profileText: str
    domains: Dict[str, str]

class TranslateRequest(BaseModel):
    text: str

def preprocess(text):
    if not text:
        return ""
    tokens = nltk.word_tokenize(text.lower())
    tokens = [lemmatizer.lemmatize(token) for token in tokens if token.isalpha() and token not in stop_words]
    return " ".join(tokens)

def translate_text(text):
    print(f"[Pipeline] Translating text (length: {len(text)} chars)...", flush=True)
    translator = GoogleTranslator(source="id", target="en")
    if len(text) <= 4500:
        return translator.translate(text)
    
    sentences = nltk.sent_tokenize(text)
    chunks = []
    current = ""
    for s in sentences:
        if len(current) + len(s) < 4500:
            current += s + " "
        else:
            if current.strip():
                chunks.append(translator.translate(current.strip()))
            current = s + " "
    if current.strip():
        chunks.append(translator.translate(current.strip()))
    return " ".join(chunks)

@app.post("/translate")
async def translate_endpoint(data: TranslateRequest):
    try:
        if not data.text:
            return {"translated": ""}
        return {"translated": translate_text(data.text)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze")
async def analyze(data: AnalyzeRequest):
    try:
        print("[Pipeline] Received analysis request...", flush=True)
        if not data.profileText:
            raise HTTPException(status_code=400, detail="Profile text is empty")
        
        print("[Pipeline] Starting translation...", flush=True)
        client_text_en = translate_text(data.profileText)
        
        domain_names = list(data.domains.keys())
        domain_texts = list(data.domains.values())
        print(f"[Pipeline] Processing {len(domain_names)} domains...", flush=True)
        
        if not domain_texts:
            print("[Pipeline] No domains provided. Returning empty.", flush=True)
            return {"results": []}

        print("[Pipeline] Preprocessing text data...", flush=True)
        client_ready = preprocess(client_text_en)
        domains_ready = [preprocess(d) for d in domain_texts]
        
        print("[Pipeline] Calculating TF-IDF (Numeric Scores)...", flush=True)
        tfidf = TfidfVectorizer()
        tfidf_matrix = tfidf.fit_transform(domains_ready + [client_ready])
        numeric_scores = cosine_similarity(tfidf_matrix[-1], tfidf_matrix[:-1])[0]
        
        print("[Pipeline] Generating semantic embeddings with SentenceTransformer...", flush=True)
        client_embed = model.encode(client_text_en, convert_to_numpy=True)
        domain_embeds = model.encode(domain_texts, convert_to_numpy=True)
        print("[Pipeline] Calculating semantic similarity...", flush=True)
        semantic_scores = cosine_similarity([client_embed], domain_embeds)[0]
        
        print("[Pipeline] Calculating final match scores...", flush=True)
        results = []
        for i in range(len(domain_names)):
            final_score = (0.5 * semantic_scores[i]) + (0.5 * numeric_scores[i])
            results.append({
                "name": domain_names[i],
                "matchScore": round(float(final_score) * 100, 2),
                "semanticScore": round(float(semantic_scores[i]) * 100, 2),
                "numericScore": round(float(numeric_scores[i]) * 100, 2),
                "category": "Certification",
                "institution": "Certiport"
            })
            
        results.sort(key=lambda x: x["matchScore"], reverse=True)
        print("[Pipeline] Analysis complete! Returning results.", flush=True)
        return {"results": results}
    except Exception as e:
        print(f"[Pipeline] Error during analysis: {str(e)}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"status": "online", "message": "CertiMatch NLP API is ready"}
