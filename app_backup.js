const ws = new WebSocket('ws://localhost:8000');
let activeSessions = {};

// DOM Elements
const activeSessionsEl = document.getElementById('activeSessions');
const sessionHistoryEl = document.getElementById('sessionHistory');

function startSession() {
    const studentName = document.getElementById('studentName').value.trim();
    const duration = parseInt(document.getElementById('sessionDuration').value) * 60;
    
    if (!studentName) {
        alert('Please enter student name');
        return;
    }

    // Send session start to server
    ws.send(JSON.stringify({
        type: 'session_start',
        studentName: studentName,
        duration: duration
    }));
}

function updateActiveSessions(sessions) {
    activeSessionsEl.innerHTML = '';
    sessions.forEach(session => {
        const sessionEl = document.createElement('div');
        sessionEl.className = 'bg-gray-50 p-4 rounded-lg border';
        sessionEl.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="font-medium">${session.studentName}</h3>
                    <p class="text-sm text-gray-600">Started: ${new Date(session.startTime).toLocaleTimeString()}</p>
                </div>
                <div class="text-right">
                    <p class="font-mono">${formatTime(session.timeRemaining)}</p>
                    <p class="text-sm text-gray-600">${Math.floor(session.timeRemaining/60)} minutes remaining</p>
                </div>
            </div>
        `;
        activeSessionsEl.appendChild(sessionEl);
    });
}

function updateSessionHistory(sessions) {
    sessionHistoryEl.innerHTML = '';
    sessions.slice(0, 10).forEach(session => {
        const sessionEl = document.createElement('div');
        sessionEl.className = 'bg-gray-50 p-3 rounded border';
        sessionEl.innerHTML = `
            <div class="flex justify-between">
                <span class="font-medium">${session.studentName}</span>
                <span class="text-sm">${formatTime(session.duration)}</span>
            </div>
            <div class="text-xs text-gray-500 mt-1">
                ${new Date(session.startTime).toLocaleString()} - ${new Date(session.endTime).toLocaleString()}
            </div>
        `;
        sessionHistoryEl.appendChild(sessionEl);
    });
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

// WebSocket handlers
ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    switch(data.type) {
        case 'active_sessions':
            updateActiveSessions(data.sessions);
            break;
        case 'session_history':
            updateSessionHistory(data.sessions);
            break;
        case 'time_notification':
            alert(`Time's up for ${data.studentName}!`);
            break;
    }
};

ws.onopen = function() {
    // Request initial data
    ws.send(JSON.stringify({type: 'get_sessions'}));
};

ws.onerror = function(error) {
    console.error('WebSocket error:', error);
};
