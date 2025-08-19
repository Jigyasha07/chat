
const backendURL = "https://chat-yvmf.onrender.com/chat"; // Replace with your Render URL

function sendMessage(userMessage) {
  return fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: userMessage })
  })
  .then(res => res.json());
}
// Auto-correct function (simple dictionary)
function autoCorrect(text) {
  const corrections = {
    "helo": "hello",
    "thnks": "thanks",
    "plz": "please",
    "u": "you",
    "ur": "your",
    "wht": "what",
    "recieve": "receive"
  };
  return text
    .split(" ")
    .map(word => corrections[word.toLowerCase()] || word)
    .join(" ");
}

// --- Element references ---
const chatBox = document.getElementById('chat-body');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const micBtn = document.getElementById('mic-btn');
const chatWidget = document.getElementById('chat-widget');
const chatHeader = document.getElementById('chat-header');
const container = document.getElementById('chatbox');
const dictateBtn = document.getElementById('dictate-btn');

// --- Append messages ---
function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add(sender === 'user' ? 'msg-user' : 'msg-bot');
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// --- Send message ---
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage('user', message);
  userInput.value = '';

  // Typing animation
  const typingBubble = document.createElement('div');
  typingBubble.classList.add('msg-bot', 'typing');
  typingBubble.textContent = '...';
  chatBox.appendChild(typingBubble);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const response = await fetch(backendURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    chatBox.removeChild(typingBubble);
    appendMessage('bot', data.response || "⚠️ Sorry, I didn't get that.");
  } catch (error) {
    chatBox.removeChild(typingBubble);
    appendMessage('bot', "⚠️ Sorry, something went wrong. Please try again.");
    console.error("Fetch error:", error);
  }
}

// --- Event listeners for send ---
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
  if (e.key === ' ') {
    const words = userInput.value.split(" ");
    const lastWord = words.pop();
    const corrected = autoCorrect(lastWord);
    userInput.value = [...words, corrected].join(" ") + " ";
  }
});

// --- Voice input (dictation) ---
let recognition;
let isListening = false;

if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    userInput.value = transcript;
    sendMessage();
  };

  recognition.onerror = function(event) {
    console.error("Speech recognition error:", event.error);
  };

  recognition.onend = () => {
    isListening = false;
  };
} else {
  micBtn.disabled = true;
  micBtn.title = "Voice input not supported";
}

micBtn.addEventListener('click', () => {
  if (recognition && !isListening) {
    isListening = true;
    recognition.start();
  }
});

// --- Floating widget toggle ---
chatHeader.addEventListener('click', () => {
  const container = chatWidget.querySelector('.chat-container');
  container.style.display = (container.style.display === "none" || container.style.display === "") ? "flex" : "none";
});

// --- Initial setup ---
chatBox.style.display = 'flex';
chatBox.style.flexDirection = 'column';
chatBox.style.height = '100%';
chatBox.style.overflowY = 'auto';
chatBox.style.padding = '10px';
chatBox.style.backgroundColor = '#f1f1f1';
chatBox.style.borderRadius = '8px';
chatBox.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
chatBox.style.marginBottom = '10px';
chatBox.style.flexGrow = '1';
chatBox.style.scrollBehavior = 'smooth';
