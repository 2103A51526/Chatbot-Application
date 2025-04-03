// const micButton = document.getElementById('micButton');
// const micIcon = document.getElementById('micIcon');
// const userInput = document.getElementById('user-input');
// const sendButton = document.getElementById('sendButton');

// let recognition;
// let isRecording = false;

// if ('webkitSpeechRecognition' in window) {
//     recognition = new webkitSpeechRecognition();
//     recognition.continuous = true;
//     recognition.interimResults = true;

//     recognition.onresult = (event) => {
//         const transcript = Array.from(event.results)
//             .map(result => result[0])
//             .map(result => result.transcript)
//             .join('');

//         userInput.value = transcript;
//     };

//     recognition.onend = () => {
//         console.log("Speech recognition ended.");
//         isRecording = false;
//         micButton.classList.remove('recording');
//     };

//     micButton.addEventListener('click', () => {
//         if (isRecording) {
//             stopRecognition();
//         } else {
//             startRecognition();
//         }
//     });

//     sendButton.addEventListener('click', () => {
//         // Stop the microphone when the "Send" button is clicked
//         if (isRecording) {
//             stopRecognition();
//         }
//         sendMessage();
//         clearUserInput();
//     });

//     function startRecognition() {
//         recognition.start();
//         userInput.placeholder = ''; // Clear placeholder during recording
//         isRecording = true;
//         micButton.classList.add('recording');
//     }

//     function stopRecognition() {
//         recognition.stop();
//         isRecording = false;
//         micButton.classList.remove('recording');
//     }

//     function clearUserInput() {
//         userInput.value = ''; // Clear the input field after sending the message
//     }
// } else {
//     alert("Your browser does not support Speech Recognition.");
// }
