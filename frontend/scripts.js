// =====================
// Backend URL
// =====================
const API_URL = "https://chat-yvmf.onrender.com";

// =====================
// DOM Elements
// =====================
const inputBox = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const micBtn = document.getElementById("mic-button");
const chatBox = document.getElementById("chat-box");
const recordingIndicator = document.getElementById("recording-indicator");

// =====================
// Display messages
// =====================
function displayMessage(sender, message) {
  const msgDiv = document.createElement("div");
  msgDiv.className = sender;
  msgDiv.textContent = message;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// =====================
// Send text message to backend
// =====================
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

// Send button click
sendBtn.onclick = sendMessage;

// Enter key press
inputBox.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

// =====================
// Audio dictation (backend-based)
// =====================
micBtn.onclick = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("⚠️ Your browser does not support microphone.");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    let chunks = [];

    mediaRecorder.ondataavailable = e => chunks.push(e.data);
    mediaRecorder.onstart = () => {
      recordingIndicator.style.display = "inline";
      console.log("🎤 Recording started...");
    };
    mediaRecorder.onstop = async () => {
      recordingIndicator.style.display = "none";

      const blob = new Blob(chunks, { type: "audio/webm" });
      chunks = [];

      const formData = new FormData();
      formData.append("audio", blob, "voice.webm");

      try {
        const res = await fetch(`${API_URL}/dictate`, { method: "POST", body: formData });
        const data = await res.json();
        if (data.text) {
          inputBox.value = data.text;       // Fill input box
          sendMessage();                     // Auto-send
        } else {
          alert("⚠️ Dictation failed: " + (data.error || "Unknown error"));
        }
      } catch (err) {
        console.error(err);
        alert("⚠️ Failed to send audio to backend.");
      }
    };

    // Record 5 seconds
    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), 5000);

  } catch (err) {
    console.error(err);
    alert("⚠️ Could not access microphone. P
