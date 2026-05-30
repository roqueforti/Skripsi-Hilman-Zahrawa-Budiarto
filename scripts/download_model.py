import os
from sentence_transformers import SentenceTransformer

def download_and_save_model():
    model_name = "all-MiniLM-L6-v2"
    save_path = os.path.join(os.getcwd(), "models", model_name)
    
    if not os.path.exists(save_path):
        print(f"Downloading model {model_name}...")
        model = SentenceTransformer(model_name)
        
        print(f"Saving model to {save_path}...")
        os.makedirs(save_path, exist_ok=True)
        model.save(save_path)
        print("Model saved successfully.")
    else:
        print(f"Model already exists at {save_path}")

if __name__ == "__main__":
    download_and_save_model()
