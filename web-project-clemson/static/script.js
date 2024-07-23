let chunks = [];
let recorder;
let isRecording = false;
let isProcessing = false;

const recordButton = document.getElementById('recordButton');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const chatBox = document.getElementById('chat-box');
const sidebarToggle = document.getElementById('sidebar-toggle');
const modeToggle = document.getElementById('mode-toggle-checkbox');
const sidebar = document.querySelector('.sidebar');
const newConversationBtn = document.getElementById('new-conversation-btn');
const conversationContent = document.querySelector('.conversation-content');
const chatContainer = document.querySelector('.chat-container');

userInput.addEventListener('input', () => {
    sendButton.disabled = userInput.value.trim() === '' || isProcessing;
});

sendButton.addEventListener('click', () => {
    const message = userInput.value.trim();
    if (message && !isProcessing) {
        isProcessing = true;
        appendMessage('user', message);
        userInput.value = '';
        sendButton.disabled = true;
        processMessage(message);
    }
});

recordButton.addEventListener('click', () => {
    if (!isRecording) {
        chunks = [];
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                recorder = new MediaRecorder(stream);
                recorder.start();
                isRecording = true;
                recordButton.textContent = 'Detener';

                recorder.ondataavailable = e => {
                    chunks.push(e.data);
                    if (recorder.state == 'inactive') {
                        let blob = new Blob(chunks, { type: 'audio/wav' });
                        uploadAudio(blob);
                    }
                };
            }).catch(console.error);
    } else {
        recorder.stop();
        isRecording = false;
        recordButton.textContent = 'Grabar';
    }
});

function uploadAudio(blob) {
    let formData = new FormData();
    formData.append('audio', blob, 'input.wav');

    fetch('/transcribe', {
        method: 'POST',
        body: formData
    })
        .then(response => response.text())
        .then(text => {
            userInput.value = text;
            sendButton.disabled = false;
        })
        .catch(console.error);
}

function appendMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add(sender === 'user' ? 'user-message' : 'bot-message');

    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');
    messageContent.textContent = message;

    const voiceButton = document.createElement('button');
    voiceButton.textContent = 'Voz';
    voiceButton.classList.add('voice-button');
    voiceButton.addEventListener('click', () => {
        if (!isProcessing) {
            isProcessing = true;
            synthesizeTextToAudio(message);
        }
    });

    messageElement.appendChild(messageContent);
    messageElement.appendChild(voiceButton);
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function synthesizeTextToAudio(text) {
    fetch('/synthesize', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: text })
    })
    .then(response => response.blob())
    .then(blob => {
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.addEventListener('ended', () => {
            URL.revokeObjectURL(audioUrl);
            isProcessing = false;
        });
        audio.play();
    })
    .catch(console.error);
}

function processMessage(message) {
    fetch('/process', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: message })
    })
        .then(response => response.json())
        .then(data => {
            appendMessage('bot', data.answer);
            isProcessing = false;
            sendButton.disabled = userInput.value.trim() === '';
        })
        .catch(console.error);
}

modeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode');
});

sidebarToggle.addEventListener('click', function () {
    sidebar.classList.toggle('collapsed');

    if (sidebar.classList.contains('collapsed')) {
        chatContainer.style.width = 'calc(100% - 50px)';
        chatContainer.style.marginLeft = '50px';
    } else {
        chatContainer.style.width = 'calc(100% - 300px)';
        chatContainer.style.marginLeft = '300px';
    }
});

newConversationBtn.addEventListener('click', function () {
    conversationContent.textContent = "New Conversation Started!";
});

document.addEventListener('DOMContentLoaded', function () {
    modeToggle.addEventListener('change', function () {
        chatContainer.classList.toggle('light-mode');
        chatContainer.classList.toggle('dark-mode');
    });
});