const ws = new WebSocket('ws://localhost:8000');
let activeSessions = [];

// DOM Elements
const activeSessionsEl = document.getElementById('activeSessions');
const sessionHistoryEl = document.getElementById('sessionHistory');
const activeCountEl = document.getElementById('activeCount');
const noSessionsMessage = document.getElementById('noSessionsMessage');
const noHistoryMessage = document.getElementById('noHistoryMessage');
const refreshHistoryBtn = document.getElementById('refreshHistory');

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const sunIcon = document.getElementById('sunIcon');
const moonIcon = document.getElementById('moonIcon');

function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    sunIcon.classList.toggle('hidden');
    moonIcon.classList.toggle('hidden');
    localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
}

// Initialize theme from localStorage
if (localStorage.getItem('darkMode') === 'true') {
    document.documentElement.classList.add('dark');
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    themeToggle.addEventListener('click', toggleTheme);
    refreshHistoryBtn.addEventListener('click', () => {
        ws.send(JSON.stringify({type: 'get_history'}));
    });
});

function startSession() {
    const studentName = document.getElementById('studentName').value.trim();
    const duration = parseInt(document.getElementById('sessionDuration').value) * 60;
    
    if (!studentName) {
        alert('Please enter student name');
        return;
    }

    ws.send(JSON.stringify({
        type: 'session_start',
        studentName: studentName,
        duration: duration
    }));
}

function updateActiveSessions(sessions) {
    activeSessions = sessions;
    activeCountEl.textContent = `${sessions.length} active`;
    activeSessionsEl.innerHTML = '';
    
    if (sessions.length === 0) {
        noSessionsMessage.classList.remove('hidden');
        return;
    }
    
    noSessionsMessage.classList.add('hidden');
    
    sessions.forEach(session => {
        const progress = ((session.duration - session.timeRemaining) / session.duration) * 100;
        const sessionEl = document.createElement('div');
        sessionEl.className = 'bg-gray-50 p-4 rounded-lg border border-gray-200';
        sessionEl.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <div>
                    <h3 class="font-medium text-gray-800">${session.studentName}</h3>
                    <p class="text-sm text-gray-500">Started: ${new Date(session.startTime).toLocaleTimeString()}</p>
                </div>
                <div class="text-right">
                    <p class="font-mono text-lg">${formatTime(session.timeRemaining)}</p>
                    <p class="text-sm text-gray-500">${Math.floor(session.timeRemaining/60)}m remaining</p>
                </div>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-blue-600 h-2 rounded-full" style="width: ${progress}%"></div>
            </div>
        `;
        activeSessionsEl.appendChild(sessionEl);
    });
}

function updateSessionHistory(sessions) {
    sessionHistoryEl.innerHTML = '';
    
    if (sessions.length === 0) {
        noHistoryMessage.classList.remove('hidden');
        return;
    }
    
    noHistoryMessage.classList.add('hidden');
    
    sessions.slice(0, 10).forEach(session => {
        const sessionEl = document.createElement('div');
        sessionEl.className = 'bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition';
        sessionEl.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="font-medium text-gray-800">${session.studentName}</h3>
                    <div class="text-sm text-gray-500">
                        ${new Date(session.startTime).toLocaleString()} - ${new Date(session.endTime).toLocaleTimeString()}
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-mono">${formatTime(session.duration)}</p>
                    <p class="text-xs text-gray-500">Completed</p>
                </div>
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
            showTimeNotification(data.studentName);
            break;
    }
};

function showTimeNotification(studentName) {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg';
    notification.innerHTML = `
        <p class="font-medium">Time's up for ${studentName}!</p>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

ws.onopen = function() {
    ws.send(JSON.stringify({type: 'get_sessions'}));
    ws.send(JSON.stringify({type: 'get_history'}));
};

ws.onerror = function(error) {
    console.error('WebSocket error:', error);
};
