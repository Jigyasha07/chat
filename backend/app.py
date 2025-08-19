import json
import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import difflib
import openai  # Only for Whisper dictation

# --------------------
# Load environment variables
# --------------------
load_dotenv()
HF_TOKEN = os.getenv("HF_API_KEY")         # Hugging Face API key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")  # OpenAI key for Whisper
openai.api_key = OPENAI_API_KEY

# --------------------
# Flask setup
# --------------------
app = Flask(__name__)
CORS(app)

# --------------------
# Settings / Files
# --------------------
USE_OFFLINE_MODE = True
FAQ_FILE = os.path.join(os.path.dirname(__file__), "faq.jsonl")
MODEL_NAME = "gpt2"
API_URL = f"https://api-inference.huggingface.co/pipeline/text-generation/{MODEL_NAME}"
HEADERS = {"Authorization": f"Bearer {HF_TOKEN}"} if HF_TOKEN else {}

# --------------------
# Helpers for FAQ / Hugging Face
# --------------------
def load_faq():
    items = []
    if os.path.exists(FAQ_FILE):
        with open(FAQ_FILE, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    items.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
    return items

def simple_similarity(a: str, b: str) -> float:
    return difflib.SequenceMatcher(None, a.lower(), b.lower()).ratio()

def faq_answer(user_message: str) -> str | None:
    data = load_faq()
    if not data:
        return None
    best, best_score = None, 0.0
    for item in data:
        q, a = item.get("question", ""), item.get("answer", "")
        score = simple_similarity(user_message, q)
        if score > best_score:
            best_score, best = score, a
    return best if best_score >= 0.6 else None

def query_hf_model(prompt: str) -> str:
    if not HF_TOKEN:
        return "⚠️ Hugging Face API key missing. Using offline mode."
    try:
        response = requests.post(API_URL, headers=HEADERS, json={"inputs": prompt}, timeout=30)
        if response.status_code != 200:
            return f"⚠️ Error {response.status_code}: {response.text}"
        result = response.json()
        if isinstance(result, list) and "generated_text" in result[0]:
            return result[0]["generated_text"]
        return str(result)
    except Exception as e:
        return f"⚠️ Error connecting to Hugging Face: {e}"

def proactive_suggestion(user_message: str) -> str | None:
    triggers = {
        "hello": "Hi there! How can I assist you today?",
        "hi": "Hello! What can I help you with?",
        "apply": "Would you like to see available jobs or upload your resume?",
        "job": "Are you searching for full-time, part-time, or remote jobs?",
        "help": "I can assist with job search, applications, or account support. Which one do you need?",
        "salary": "Do you want to know average salaries for a role or your specific job posting?"
    }
    for key, suggestion in triggers.items():
        if key in user_message.lower():
            return suggestion
    return None

# --------------------
# Routes
# --------------------
@app.route("/", methods=["GET"])
def home():
    return "✅ Chatbot API running"

@app.route("/", methods=["POST"])
def root_chat():
    return chat()

@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message", "")
    answer = faq_answer(user_message)
    if answer:
        return jsonify({"response": answer})
    
    suggestion = proactive_suggestion(user_message)
    if suggestion:
        return jsonify({"response": suggestion})
    
    return jsonify({"response": "I'm not sure I understand. Can you rephrase?"})

@app.route("/generate", methods=["POST"])
def generate():
    user_message = request.json.get("message", "")
    if not user_message:
        return jsonify({"response": "Please provide a message."})
    
    answer = faq_answer(user_message)
    if answer:
        return jsonify({"response": answer})
    
    suggestion = proactive_suggestion(user_message)
    if suggestion:
        return jsonify({"response": suggestion})
    
    generated_text = query_hf_model(user_message)
    return jsonify({"response": generated_text})

@app.route("/faq", methods=["GET"])
def get_faq():
    faq_data = load_faq()
    return jsonify(faq_data)

# --------------------
# Dictation endpoint (OpenAI Whisper)
# --------------------
@app.route("/dictate", methods=["POST"])
def dictate():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["audio"]

    try:
        transcription = openai.Audio.transcriptions.create(
            file=audio_file,
            model="whisper-1"
        )
        text = transcription["text"]
        return jsonify({"text": text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --------------------
# Run app
# --------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
