let timerInterval;
let startTime;
let studentName = '';
const ws = new WebSocket('ws://localhost:8000');

// DOM Elements
const studentForm = document.getElementById('studentForm');
const timerDisplay = document.getElementById('timerDisplay');
const timerElement = document.getElementById('timer');
const studentDisplay = document.getElementById('studentDisplay');

function startSession() {
    studentName = document.getElementById('studentName').value.trim();
    if (!studentName) {
        alert('Please enter your name');
        return;
    }

    startTime = new Date();
    studentForm.classList.add('hidden');
    timerDisplay.classList.remove('hidden');
    studentDisplay.textContent = `Student: ${studentName}`;
    
    // Start timer
    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();

    // Send session start to server
    ws.send(JSON.stringify({
        type: 'session_start',
        studentName: studentName,
        startTime: startTime.toISOString()
    }));
}

function endSession() {
    clearInterval(timerInterval);
    const endTime = new Date();
    const duration = Math.floor((endTime - startTime) / 1000);

    // Send session end to server
    ws.send(JSON.stringify({
        type: 'session_end',
        studentName: studentName,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: duration
    }));

    alert(`Session ended. Total study time: ${formatTime(duration)}`);
    resetTimer();
}

function updateTimer() {
    const currentTime = new Date();
    const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
    timerElement.textContent = formatTime(elapsedSeconds);
}

function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
    ].join(':');
}

function resetTimer() {
    studentForm.classList.remove('hidden');
    timerDisplay.classList.add('hidden');
    timerElement.textContent = '00:00:00';
    document.getElementById('studentName').value = '';
}

// WebSocket handlers
ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.type === 'time_notification') {
        alert(`Time's up for ${data.studentName}!`);
    }
};

ws.onerror = function(error) {
    console.error('WebSocket error:', error);
};
