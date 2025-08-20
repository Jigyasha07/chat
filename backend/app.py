import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

API_URL = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium"
headers = {"Authorization": "Bearer YOUR_HF_TOKEN"}  # replace with your free Hugging Face token

@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message")
    payload = {"inputs": user_message}

    response = requests.post(API_URL, headers=headers, json=payload)

    try:
        bot_reply = response.json()[0]['generated_text']
    except Exception:
        bot_reply = "⚠️ Sorry, I couldn’t generate a reply."

    return jsonify({"response": bot_reply})

if __name__ == "__main__":
    app.run(debug=True)
