const sendButton = document.querySelector(".send-btn");
const micButton = document.querySelector(".mic-btn");
const inputField = document.querySelector(".chat-input");
const messages = document.querySelector(".messages");

// Helper to add messages
function addMessage(text, sender = "user") {
  const div = document.createElement("div");
  div.className = `msg ${sender}`;
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// Send button click
sendButton.addEventListener("click", () => {
  const text = inputField.value.trim();
  if (!text) return;
  addMessage(text, "user");
  inputField.value = "";

  fetch("http://127.0.0.1:5000/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text })
  })
    .then(res => res.json())
    .then(data => addMessage(data.response, "bot"))
    .catch(err => {
      console.error("Error:", err);
      addMessage("⚠️ Server error. Try again later.", "bot");
    });
});

// Enter key to send
inputField.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendButton.click();
});

// 🎤 Voice support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;

  micButton.addEventListener("click", async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      recognition.start();
      addMessage("🎤 Listening...", "bot");
    } catch (err) {
      console.error("Mic error:", err);
      alert("⚠️ Please allow microphone access.");
    }
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    inputField.value = transcript;
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    alert("⚠️ Voice input failed. Use Chrome + HTTPS.");
  };
} else {
  micButton.disabled = true;
  micButton.title = "Voice not supported";
}
