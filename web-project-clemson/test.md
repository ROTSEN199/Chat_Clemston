let chunks = [];
let recorder;
let isRecording = false;
let isProcessing = false; // Variable para rastrear si se está procesando una pregunta

const recordButton = document.getElementById('recordButton');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const chatBox = document.getElementById('chat-box');

userInput.addEventListener('input', () => {
    sendButton.disabled = userInput.value.trim() === '' || isProcessing;
});

sendButton.addEventListener('click', () => {
    const message = userInput.value.trim();
    if (message && !isProcessing) {
        isProcessing = true; // Marcar que se está procesando una pregunta
        appendMessage('user', message);
        userInput.value = '';
        sendButton.disabled = true;
        processMessage(message);
    }
});

recordButton.addEventListener('click', () => {
    if (!isRecording) {
        // Comenzar a grabar
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
        // Detener la grabación
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
            userInput.value = text; // Mostrar la transcripción en el cuadro de texto
            sendButton.disabled = false; // Habilitar el botón de enviar
        })
        .catch(console.error);
}

function appendMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    if (sender === 'user') {
        messageElement.classList.add('user-message');
    } else {
        messageElement.classList.add('bot-message');
    }
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
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
            isProcessing = false; // Marcar que se ha terminado de procesar la pregunta
            sendButton.disabled = userInput.value.trim() === ''; // Volver a habilitar el botón de envío si el cuadro de texto no está vacío
        })
        .catch(console.error);
}


body {
    font-family: 'Arial', sans-serif;
    margin: 0;
    background-color: #f4f4f4;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}

.chat-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 600px;
    background-color: #fff;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    overflow: hidden;
}

.chat-box {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background-color: #fff;
}

.input-container {
    display: flex;
    border-top: 1px solid #ccc;
}

#user-input {
    flex: 1;
    padding: 15px;
    font-size: 16px;
    border: none;
    outline: none;
}

button {
    padding: 15px 20px;
    font-size: 16px;
    cursor: pointer;
    border: none;
    outline: none;
    background-color: #007bff;
    color: #fff;
    transition: background-color 0.3s;
}

button:hover {
    background-color: #0056b3;
}

button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

.user-message {
    text-align: right;
    color: #333;
    margin: 10px 0;
}

.bot-message {
    text-align: left;
    color: #333;
    margin: 10px 0;
}



<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web-VoiLLM Chatbot</title>
    <link rel="stylesheet" href="/static/style.css">
</head>
<body>
    <div class="chat-container">
        <div id="chat-box" class="chat-box"></div>
        <div class="input-container">
            <input type="text" id="user-input" placeholder="Escribe tu mensaje o graba un audio...">
            <button id="send-button" disabled>Enviar</button>
            <button id="recordButton">Grabar</button>
        </div>
    </div>

    <script src="/static/script.js"></script>
</body>
</html>