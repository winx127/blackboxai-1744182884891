const express = require('express');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8000;

// Create HTTP server
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Initialize WebSocket server
const wss = new WebSocket.Server({ server });

// Create students.json if it doesn't exist
const dataPath = path.join(__dirname, 'students.json');
if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify([], null, 2));
}

// Store active sessions
const activeSessions = new Map();

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        switch (data.type) {
            case 'session_start':
                handleSessionStart(ws, data);
                break;
            case 'session_end':
                handleSessionEnd(data);
                break;
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

function handleSessionStart(ws, data) {
    const sessionId = Date.now().toString();
    activeSessions.set(sessionId, {
        ws,
        studentName: data.studentName,
        startTime: new Date(data.startTime)
    });

    // Schedule notification for 1 hour later (demo purposes)
    setTimeout(() => {
        const session = activeSessions.get(sessionId);
        if (session) {
            session.ws.send(JSON.stringify({
                type: 'time_notification',
                studentName: session.studentName
            }));
        }
    }, 1000 * 60 * 60); // 1 hour
}

function handleSessionEnd(data) {
    // Save session to JSON file
    const sessions = JSON.parse(fs.readFileSync(dataPath));
    sessions.push({
        studentName: data.studentName,
        startTime: data.startTime,
        endTime: data.endTime,
        duration: data.duration
    });
    fs.writeFileSync(dataPath, JSON.stringify(sessions, null, 2));
}

// Serve static files
app.use(express.static(__dirname));

// API endpoint to get all sessions
app.get('/api/sessions', (req, res) => {
    const sessions = JSON.parse(fs.readFileSync(dataPath));
    res.json(sessions);
});
