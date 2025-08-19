from flask import Flask, request, jsonify
from flask_cors import CORS
import json, os, requests, difflib
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)

# ---------------- Settings ----------------
FAQ_FILE = os.path.join(os.path.dirname(__file__), "faq.jsonl")
load_dotenv()
HF_TOKEN = os.getenv("HF_API_KEY")
MODEL_NAME = "gpt2"
API_URL = f"https://api-inference.huggingface.co/pipeline/text-generation/{MODEL_NAME}"
HEADERS = {"Authorization": f"Bearer {HF_TOKEN}"} if HF_TOKEN else {}

# ---------------- Helpers -----------------
def load_faq():
    items = []
    if os.path.exists(FAQ_FILE):
        with open(FAQ_FILE, "r", encoding="utf-8") as f:
            for line in f:
                try: items.append(json.loads(line))
                except json.JSONDecodeError: pass
    return items

def simple_similarity(a: str, b: str) -> float:
    return difflib.SequenceMatcher(None, a.lower(), b.lower()).ratio()

def faq_answer(user_message: str) -> str | None:
    data = load_faq()
    best, best_score = None, 0.0
    for item in data:
        q, a = item.get("question", ""), item.get("answer", "")
        score = simple_similarity(user_message, q)
        if score > best_score:
            best_score, best = score, a
    return best if best_score >= 0.5 else None

def query_hf_model(prompt: str) -> str:
    if not HF_TOKEN:
        return "⚠️ Hugging Face API key missing."
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
        "greeting": "Greetings! How can I assist you today?",
        "apply": "Would you like to see available jobs or upload your resume?",
        "job": "Are you searching for full-time, part-time, or remote jobs?",
        "help": "I can assist with job search, applications, or account support. Which one do you need?",
        "salary": "Do you want to know average salaries for a role or your specific job posting?"
    }
    for key, suggestion in triggers.items():
        if key in user_message.lower():
            return suggestion
    return None

# ---------------- Routes ------------------
@app.route("/", methods=["GET"])
def home():
    return "✅ Chatbot API running"

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json(silent=True) or {}
        user_message = data.get("message", "")
        if not user_message:
            return jsonify({"response": "⚠️ No message received"}), 400

        answer = faq_answer(user_message)
        if answer: return jsonify({"response": answer})

        suggestion = proactive_suggestion(user_message)
        if suggestion: return jsonify({"response": suggestion})

        generated_text = query_hf_model(user_message)
        return jsonify({"response": generated_text})
    except Exception as e:
        return jsonify({"response": f"⚠️ Internal server error: {str(e)}"}), 500

@app.route("/faq", methods=["GET"])
def get_faq():
    return jsonify(load_faq())

@app.route("/dictate", methods=["POST"])
def dictate():
    if "audio" not in request.files:
        return jsonify({"error": "No audio uploaded"}), 400

    audio_file = request.files["audio"]
    headers = {"Authorization": f"Bearer {HF_TOKEN}"} if HF_TOKEN else {}
    files = {"file": (audio_file.filename, audio_file.stream, audio_file.mimetype)}

    try:
        response = requests.post(
            "https://api-inference.huggingface.co/models/openai/whisper-base",
            headers=headers,
            files=files,
            timeout=60
        )
        data = response.json()
        if "text" in data:
            return jsonify({"text": data["text"]})
        else:
            return jsonify({"error": data}), 500
    except Exception as e:
        return jsonify({"error": f"Failed to reach ASR model: {str(e)}"}), 500

# ---------------- Run ---------------------
if __name__ == "__main__":
    app.run(debug=True)
