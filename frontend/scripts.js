// Force local API for now
const API_URL = "https://chat-ewrn.onrender.com"; // For deployed backend

// =====================
// DOM Elements
// =====================
// Get elements
const sendButton = document.querySelector(".send-btn");
const micButton = document.querySelector(".mic-btn");
const inputField = document.querySelector(".chat-input");
const messagesContainer = document.querySelector(".messages");

// Function to append message
function addMessage(text, sender = "user") {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.textContent = text;
  messagesContainer.appendChild(msg);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Handle send button click
sendButton.addEventListener("click", () => {
  const text = inputField.value.trim();
  if (text !== "") {
    addMessage(text, "user");
    inputField.value = "";

    // TODO: send text to your chatbot backend here
    setTimeout(() => {
      addMessage("🤖 Reply from bot here...", "bot");
    }, 500);
  }
});

// Handle Enter key
inputField.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    sendButton.click();
  }
});

// 🎤 Voice recognition setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;

  micButton.addEventListener("click", () => {
    recognition.start();
    console.log("🎤 Listening...");
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    console.log("You said:", transcript);
    inputField.value = transcript;
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    alert("⚠️ Microphone not working. Please allow mic access & use HTTPS.");
  };
} else {
  console.warn("SpeechRecognition not supported in this browser.");
  micButton.disabled = true;
}
