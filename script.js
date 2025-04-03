window.onload = function() {
    // Automatically send greeting message when the page loads
    setTimeout(function() {
        addMessage('Chatbot: Hello, how can I assist you today?', 'chatbot-message');
        speak('Hello, how can I assist you today?');
    }, 1000); // 1000 milliseconds = 1 second

    // Add event listener to input box to detect 'Enter' key press
    document.getElementById('user-input').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });
};

async function sendMessage() {
    const inputBox = document.getElementById('user-input');
    const userInput = inputBox.value;

    if (userInput.trim() === '') return;

    addMessage('You: ' + userInput, 'user-message');
    inputBox.value = '';

    document.getElementById('typing-indicator').style.display = 'block'; // Show typing indicator

    // Check if the input is "student information"
    if (userInput.toLowerCase() === 'student information') {
        askForRollNumber();
        document.getElementById('typing-indicator').style.display = 'none'; // Hide typing indicator
        return; // Exit the function
    }
    // Check if the input is "faculty information"
    if (userInput.toLowerCase() === 'faculty information') {
        askForFacultyName(); // Function to ask for faculty name
        document.getElementById('typing-indicator').style.display = 'none'; // Hide typing indicator
        return; // Exit the function
    }
    
    // Check if the input is a calculation
    const calculationResult = calculate(userInput);
    if (calculationResult !== null) {
        // If it's a valid calculation, display the result
        await simulateTyping('Chatbot: The result is ' + calculationResult);
        speak('The result is ' + calculationResult);
        document.getElementById('typing-indicator').style.display = 'none'; // Hide typing indicator
        return; // Exit the function
    }

    const response = await fetch('/ask', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_input: userInput })
    });

    const data = await response.json();
    document.getElementById('typing-indicator').style.display = 'none'; // Hide typing indicator

    if (data.unknown) {
        // If the bot doesn't know the answer, ask the user for input
        askForNewAnswer(userInput);
    } else {
        await simulateTyping('Chatbot: ' + data.response);
        speak(data.response);
    }
function speak(text) {
    if ('speechSynthesis' in window) {
        const speech = new SpeechSynthesisUtterance(text);
        speech.lang = 'hi-IN'; // Set the language
        window.speechSynthesis.speak(speech);
    } else {
        console.error('Text-to-Speech is not supported in this browser.');
    }
}
}
async function simulateTyping(text) {
    // Simulate typing effect by adding one character at a time
    addMessage(text, 'chatbot-message');
}

// Function to simulate typing effect
function simulateTyping(message) {
    return new Promise((resolve) => {
        const typingDelay = 20; // milliseconds
        const typingMessage = 'Typing...';
        addMessage(typingMessage, 'chatbot-message');

        // Simulate typing
        let i = 0;
        const typingInterval = setInterval(() => {
            if (i < message.length) {
                document.getElementsByClassName('chatbot-message')[document.getElementsByClassName('chatbot-message').length - 1].innerText = typingMessage + '\n' + message.substring(0, i + 1);
                i++;
            } else {
                clearInterval(typingInterval);
                // Remove the typing message
                removeTypingMessage();
                resolve();
            }
        }, typingDelay);
    });
}

// Function to remove the typing message
function removeTypingMessage() {
    const messages = document.getElementsByClassName('chatbot-message');
    if (messages.length > 0) {
        messages[messages.length - 1].innerText = messages[messages.length - 1].innerText.split('\n')[1]; // Keep only the actual message part
    }
}

// Function to evaluate mathematical expressions
function calculate(expression) {
    const regex = /^\s*(-?\d+(\.\d+)?)\s*([\+\-\*\/])\s*(-?\d+(\.\d+)?)\s*$/;
    const match = expression.match(regex);

    if (match) {
        const num1 = parseFloat(match[1]);
        const operator = match[3];
        const num2 = parseFloat(match[4]);

        switch (operator) {
            case '+':
                return num1 + num2;
            case '-':
                return num1 - num2;
            case '*':
                return num1 * num2;
            case '/':
                return num1 / num2;
            default:
                return null; // Invalid operator
        }
    } else {
        return null; // Invalid input
    }
}


function askForNewAnswer(userInput) {
    const chatbox = document.getElementById('chatbox');

    // Display the message before asking for the answer
    addMessage('Chatbot: I do not know the answer, can you help me!', 'chatbot-message');

    const newAnswerInput = document.createElement('input');
    newAnswerInput.placeholder = 'Please provide the answer...';
    newAnswerInput.classList.add('styled-placeholder');
    newAnswerInput.style.width = '80%'; // Adjust as needed
    newAnswerInput.style.margin = '10px 0';
    chatbox.appendChild(newAnswerInput);
    
    const submitButton = document.createElement('button');
    submitButton.innerText = 'Submit';
    submitButton.classList.add('small-button');
    chatbox.appendChild(submitButton);
    
    submitButton.onclick = async () => {
        const newAnswer = newAnswerInput.value;
        if (newAnswer.trim() === '') return;

        addMessage('You: ' + newAnswer, 'user-message');

        // Send the new answer to the server for storage
        await fetch('/update-knowledge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_input: userInput, new_answer: newAnswer })
        });

        chatbox.removeChild(newAnswerInput);
        chatbox.removeChild(submitButton);
        addMessage('Chatbot: Thanks! I will remember that.', 'chatbot-message');
    };
}

function addMessage(message, className) {
    const chatbox = document.getElementById('chatbox');
    const messageElement = document.createElement('div');
    messageElement.className = className;
    messageElement.innerText = message;
    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight; 
}

// Function to ask for roll number input for student information
async function askForRollNumber() {
    const chatbox = document.getElementById('chatbox');

    // Display prompt for roll number
    addMessage('Chatbot: Please enter the roll number to get student information:', 'chatbot-message');

    const rollNumberInput = document.createElement('input');
    rollNumberInput.placeholder = 'Enter Roll Number...';
    rollNumberInput.id = 'roll-number-input';
    rollNumberInput.style.width = '80%';
    rollNumberInput.style.margin = '10px 0';
    chatbox.appendChild(rollNumberInput);

    const fetchButton = document.createElement('button');
    fetchButton.innerText = 'Get Info';
    fetchButton.classList.add('small-button');
    chatbox.appendChild(fetchButton);

    fetchButton.onclick = async () => {
        const rollNo = rollNumberInput.value;
        if (rollNo.trim() === '') {
            await simulateTyping('Chatbot: Please enter a valid roll number.');
            return;
        }

        const response = await fetch(`/api/students/${rollNo}`);
        const data = await response.json();

        // Clear previous student info if any
        const existingTable = document.getElementById('student-info-table');
        if (existingTable) {
            chatbox.removeChild(existingTable);
        }

        if (response.ok) {
            // Create a table to display student data
            const table = document.createElement('table');
            table.id = 'student-info-table';

            // Create table headers
            const headers = ['Field', 'Information'];
            const headerRow = document.createElement('tr');
            headers.forEach(header => {
                const th = document.createElement('th');
                th.innerText = header;
                headerRow.appendChild(th);
            });
            table.appendChild(headerRow);

            // Add student data to the table
            const fields = [
                { label: 'Name', value: data.name },
                { label: 'Roll No', value: data.roll_no },
                { label: 'CGPA', value: data.cgpa },
                { label: 'Mobile Number', value: data.mobile_number }
            ];

            for (const field of fields) {
                const row = document.createElement('tr');
                const fieldCell = document.createElement('td');
                const valueCell = document.createElement('td');

                fieldCell.innerText = field.label;
                valueCell.innerText = field.value;

                row.appendChild(fieldCell);
                row.appendChild(valueCell);
                table.appendChild(row);
            }

            // Append table to the chatbox with typing effect
            await simulateTyping('Chatbot: Here is the student information:');
            chatbox.appendChild(table);
        } else {
            // Handle error case (student not found)
            await simulateTyping('Chatbot: Enter Valid Roll No.');
        }

        // Remove input and button after fetching info
        chatbox.removeChild(rollNumberInput);
        chatbox.removeChild(fetchButton);
    };
}



// Faculty details start from here

// Function to ask for faculty name input for faculty information
async function askForFacultyName() {
    const chatbox = document.getElementById('chatbox');

    // Display prompt for faculty name
    addMessage('Chatbot: Please enter the faculty name to get faculty information:', 'chatbot-message');

    const facultyNameInput = document.createElement('input');
    facultyNameInput.placeholder = 'Enter Faculty Name...';
    facultyNameInput.id = 'faculty-name-input';
    facultyNameInput.style.width = '80%';
    facultyNameInput.style.margin = '10px 0';
    chatbox.appendChild(facultyNameInput);

    const fetchButton = document.createElement('button');
    fetchButton.innerText = 'Get Info';
    fetchButton.classList.add('small-button');
    chatbox.appendChild(fetchButton);

    fetchButton.onclick = async () => {
        const facultyName = facultyNameInput.value;
        if (facultyName.trim() === '') {
            await simulateTyping('Chatbot: Please enter a valid faculty name.');
            return;
        }

        const response = await fetch(`/api/faculty/${facultyName}`);
        const data = await response.json();

        // Clear previous faculty info if any
        const existingTable = document.getElementById('faculty-info-table');
        if (existingTable) {
            chatbox.removeChild(existingTable);
        }

        if (response.ok) {
            // Create a table to display faculty data
            const table = document.createElement('table');
            table.id = 'faculty-info-table';

            // Create table headers
            const headers = ['Field', 'Information'];
            const headerRow = document.createElement('tr');
            headers.forEach(header => {
                const th = document.createElement('th');
                th.innerText = header;
                headerRow.appendChild(th);
            });
            table.appendChild(headerRow);

            // Add faculty data to the table
            const fields = [
                { label: 'Name', value: data.Name },
                { label: 'Department', value: data.Department },
                { label: 'Designation', value: data.Designation },
                { label: 'Email', value: data.Email },
                { label: 'Phone Number', value: data['Phone Number'] },
                { label: 'Office Number', value: data['Office Number'] },
                { label: 'Research Interests', value: data['Research Interests'] }
            ];

            for (const field of fields) {
                const row = document.createElement('tr');
                const fieldCell = document.createElement('td');
                const valueCell = document.createElement('td');

                fieldCell.innerText = field.label;
                valueCell.innerText = field.value;

                row.appendChild(fieldCell);
                row.appendChild(valueCell);
                table.appendChild(row);
            }

            // Append table to the chatbox with typing effect
            await simulateTyping('Chatbot: Here is the faculty information:');
            chatbox.appendChild(table);
        } else {
            // Handle error case (faculty not found)
            await simulateTyping('Chatbot: Faculty not found. Please enter a valid faculty name.');
        }

        // Remove input and button after fetching info
        chatbox.removeChild(facultyNameInput);
        chatbox.removeChild(fetchButton);
    };
}
