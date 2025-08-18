from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import html
import time
import json
import os
import datetime

app = Flask(__name__)
CORS(app)

# --- Logging Setup ---
logging.basicConfig(
    filename="missed_queries.log",
    level=logging.INFO,
    format="%(asctime)s - %(message)s"
)

# --- FAQ Loading ---
FAQ_FILE = r"C:\Users\jigya\Documents\code\python\chatbot_widget_fixed\faq.jsonl"
faq_data = {}

def load_faq():
    global faq_data
    faq_data = {}
    if not os.path.exists(FAQ_FILE):
        print(f"❌ FAQ file not found: {FAQ_FILE}")
        return

    with open(FAQ_FILE, "r", encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
                question = entry.get("question")
                answer = entry.get("answer")
                if question and answer:
                    key = question.strip().lower()
                    faq_data[key] = answer.strip()
                else:
                    print(f"⚠️ Skipping invalid line {i}: {line}")
            except Exception as e:
                print(f"⚠️ Error parsing line {i}: {e}")

    print(f"✅ Loaded {len(faq_data)} FAQ entries")
    print("FAQ keys:", list(faq_data.keys()))

load_faq()

# --- FAQ Answer Logic ---
def faq_answer(message):
    key = message.strip().lower()
    ans = faq_data.get(key)
    if ans and "{{current_date}}" in ans:
        today = datetime.date.today().strftime("%A, %B %d, %Y")
        ans = ans.replace("{{current_date}}", today)
    return ans

# --- Proactive Suggestions ---
def proactive_suggestion(message):
    msg = message.lower()
    if "refund" in msg:
        return "Would you like help with our refund policy?"
    return None

# --- Health Check ---
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "timestamp": time.time()})

# --- Chat Endpoint ---
@app.route("/chat", methods=["POST"])
def chat():
    try:
        # Try to parse JSON
        data = request.get_json(silent=True)
        if data is None:
            # If get_json failed, try raw data for debugging
            raw_data = request.data.decode("utf-8")
            print("⚠️ Failed to parse JSON. Raw request data:", raw_data)
            return jsonify({"reply": "⚠️ Invalid JSON or empty request.", "source": "error"})

        print("Incoming request data (parsed):", data)

        user_message = html.escape((data.get("message") or "").strip())
        print("User message after escape:", user_message)

        if not user_message:
            return jsonify({"reply": "Please provide a message.", "source": "error"})

        # FAQ match
        ans = faq_answer(user_message)
        print("FAQ answer found:", ans)
        if ans:
            return jsonify({"reply": ans, "source": "faq", "timestamp": time.time()})

        # Proactive suggestion
        suggestion = proactive_suggestion(user_message)
        print("Proactive suggestion:", suggestion)
        if suggestion:
            return jsonify({"reply": suggestion, "source": "suggestion", "timestamp": time.time()})

        # Log missed queries
        logging.info(user_message)
        print("Missed query logged.")

        # Default fallback
        return jsonify({
            "reply": "🤖 Sorry, I don’t have an answer for that yet. I’ve noted your query so we can improve.",
            "source": "offline",
            "timestamp": time.time()
        })

    except Exception as e:
        logging.error(f"Error in /chat: {str(e)}")
        print(f"Exception occurred: {str(e)}")
        return jsonify({
            "reply": "⚠️ Sorry, something went wrong.",
            "source": "error",
            "timestamp": time.time()
        })
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
