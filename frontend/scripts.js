// Backend URL (your deployed backend)
const API_URL = "https://chat-yvmf.onrender.com";

// DOM elements
const inputBox = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const micBtn = document.getElementById("mic-button");
const chatBox = document.getElementById("chat-box");

// Function to display messages
function displayMessage(sender, message) {
  const msgDiv = document.createElement("div");
  msgDiv.className = sender;
  msgDiv.textContent = message;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Send text message to backend
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

// Press Enter key
inputBox.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

// ----------------------
// Dictation (Speech Recognition)
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = "en-US";
recognition.interimResults = false;

recognition.onresult = function(event) {
  const transcript = event.results[0][0].transcript;
  inputBox.value = transcript;
  sendMessage(); // Automatically send after dictation
};

recognition.onerror = function(event) {
  console.error("Speech recognition error:", event);
  alert("⚠️ Speech recognition failed. Please try again.");
};

// Mic button click
micBtn.onclick = () => {
  try {
    recognition.start();
  } catch (err) {
    console.error("Recognition start error:", err);
  }
};
