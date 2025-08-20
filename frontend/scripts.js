// Force local API for now
const API_URL = "https://chat-ewrn.onrender.com"; // For deployed backend
// Grab elements
const sendButton = document.querySelector(".send-btn");
const micButton = document.querySelector(".mic-btn");
const inputField = document.querySelector(".chat-input");
const messages = document.querySelector(".messages");

// Helper: append message
function addMessage(text, sender = "user") {
  const div = document.createElement("div");
  div.className = `msg ${sender}`;
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// Send button
sendButton.addEventListener("click", () => {
  const text = inputField.value.trim();
  if (!text) return;
  addMessage(text, "user");
  inputField.value = "";

  // TODO: call your backend here; mocked reply for now
  setTimeout(() => addMessage("🤖 Reply from bot here…", "bot"), 400);
});

// Enter key to send
inputField.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendButton.click();
});

// ---- Voice input (Web Speech API) ----
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!window.isSecureContext && !location.hostname.match(/^(localhost|127\.0\.0\.1)$/)) {
  console.warn("Mic requires HTTPS (except on localhost).");
}

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;

  micButton.addEventListener("click", async () => {
    // 1) Ask for mic permission up front (improves Android reliability)
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error("Mic permission denied:", err);
      alert("⚠️ Please allow microphone access in your browser settings.");
      return;
    }

    // 2) Start recognition right after the user gesture
    try {
      recognition.start();
      addMessage("🎤 Listening…", "bot");
    } catch (err) {
      console.error("Recognition start error:", err);
      alert("⚠️ Could not start voice recognition. Use Chrome over HTTPS.");
    }
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    inputField.value = transcript;
    // Optional: auto-send right away:
    // sendButton.click();
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    alert(`⚠️ Voice error: ${event.error}. Use Chrome and HTTPS, then try again.`);
  };

  recognition.onend = () => {
    // remove the "listening…" helper if you added one, or ignore
  };
} else {
  console.warn("SpeechRecognition not supported.");
  micButton.disabled = true;
  micButton.title = "Voice input not supported in this browser";
}
// ---- End of voice input ----