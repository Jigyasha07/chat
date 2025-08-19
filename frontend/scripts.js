// Backend URL
const API_URL = "https://chat-yvmf.onrender.com";

// DOM elements
const inputBox = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const micBtn = document.getElementById("mic-button");
const chatBox = document.getElementById("chat-box");

// Display messages
function displayMessage(sender, message) {
  const msgDiv = document.createElement("div");
  msgDiv.className = sender;
  msgDiv.textContent = message;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Send message to backend
function sendMessage() {
  const message = inputBox.value.trim();
  if (!message) return;
  displayMessage("user", message);
  inputBox.value = "";

  fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  })
    .then(res => res.json())
    .then(data => displayMessage("bot", data.reply))
    .catch(err => displayMessage("bot", "⚠️ Something went wrong."));
}

// Button click
sendBtn.onclick = sendMessage;
inputBox.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

// ----------------------
// Bulletproof Dictation
let recognition;

if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
  alert("⚠️ Your browser does not support speech recognition. Please use Chrome or Edge.");
} else {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.interimResults = false;

  recognition.onstart = () => console.log("🎤 Microphone started...");
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    inputBox.value = transcript;
    sendMessage(); // Automatically send after dictation
  };
  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event);
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      alert("⚠️ Microphone access denied. Please allow microphone in your browser.");
    } else {
      alert("⚠️ Speech recognition failed. Try again.");
    }
  };
  recognition.onend = () => console.log("🎤 Microphone stopped.");
}

// Mic button click
micBtn.onclick = () => {
  if (!recognition) return;
  try {
    recognition.start();
  } catch (err) {
    console.error("Recognition start error:", err);
    alert("⚠️ Cannot start microphone. Please check permissions.");
  }
};
