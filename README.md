# Chatbot Widget

## Features
- Floating chatbot for any website
- Offline FAQ mode + HuggingFace AI mode
- Auto-correct for typos
- Voice dictation (🎤)
- Proactive engagement (job, apply, help, salary triggers)
- Missed query logging for retraining

## Run Locally
```bash
pip install -r requirements.txt
python app.py
```
Then open `index.html` in your browser.

## Deploy on Render
- Push this repo to GitHub
- Connect GitHub repo to Render
- Add environment variable `HF_API_KEY` in Render settings (optional).
- Deploy. If no key is present, the bot will default to offline FAQ mode.
