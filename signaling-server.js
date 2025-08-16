const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users
const connectedUsers = new Map();
const pendingCalls = new Map();

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(ws, data);
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });
    
    ws.on('close', () => {
        // Remove user from connected users
        for (const [username, user] of connectedUsers.entries()) {
            if (user.ws === ws) {
                connectedUsers.delete(username);
                console.log(`User ${username} disconnected`);
                break;
            }
        }
    });
});

// Handle different message types
function handleMessage(ws, data) {
    switch (data.type) {
        case 'login':
            handleLogin(ws, data);
            break;
        case 'call_request':
            handleCallRequest(ws, data);
            break;
        case 'call_response':
            handleCallResponse(ws, data);
            break;
        case 'ice_candidate':
            handleIceCandidate(ws, data);
            break;
        case 'offer':
            handleOffer(ws, data);
            break;
        case 'answer':
            handleAnswer(ws, data);
            break;
        default:
            console.log('Unknown message type:', data.type);
    }
}

// Handle user login
function handleLogin(ws, data) {
    const { username } = data;
    
    // Store user connection
    connectedUsers.set(username, {
        ws: ws,
        username: username,
        timestamp: Date.now()
    });
    
    console.log(`User ${username} logged in`);
    
    // Send confirmation
    ws.send(JSON.stringify({
        type: 'login_success',
        username: username
    }));
}

// Handle call request
function handleCallRequest(ws, data) {
    const { from, to } = data;
    const targetUser = connectedUsers.get(to);
    
    if (targetUser) {
        // Store pending call
        pendingCalls.set(from, {
            from: from,
            to: to,
            timestamp: Date.now()
        });
        
        // Send call notification to target user
        targetUser.ws.send(JSON.stringify({
            type: 'incoming_call',
            from: from,
            fromName: data.fromName
        }));
        
        console.log(`Call request from ${from} to ${to}`);
    } else {
        // Target user not online
        ws.send(JSON.stringify({
            type: 'call_failed',
            reason: 'User not online'
        }));
    }
}

// Handle call response (accept/reject)
function handleCallResponse(ws, data) {
    const { from, to, response } = data;
    const caller = connectedUsers.get(from);
    
    if (caller && response === 'accept') {
        // Call accepted - establish connection
        caller.ws.send(JSON.stringify({
            type: 'call_accepted',
            from: to
        }));
        
        // Remove pending call
        pendingCalls.delete(from);
        
        console.log(`Call from ${from} to ${to} accepted`);
    } else if (caller && response === 'reject') {
        // Call rejected
        caller.ws.send(JSON.stringify({
            type: 'call_rejected',
            from: to
        }));
        
        // Remove pending call
        pendingCalls.delete(from);
        
        console.log(`Call from ${from} to ${to} rejected`);
    }
}

// Handle WebRTC offer
function handleOffer(ws, data) {
    const { from, to, offer } = data;
    const targetUser = connectedUsers.get(to);
    
    if (targetUser) {
        targetUser.ws.send(JSON.stringify({
            type: 'offer',
            from: from,
            offer: offer
        }));
    }
}

// Handle WebRTC answer
function handleAnswer(ws, data) {
    const { from, to, answer } = data;
    const targetUser = connectedUsers.get(to);
    
    if (targetUser) {
        targetUser.ws.send(JSON.stringify({
            type: 'answer',
            from: from,
            answer: answer
        }));
    }
}

// Handle ICE candidates
function handleIceCandidate(ws, data) {
    const { from, to, candidate } = data;
    const targetUser = connectedUsers.get(to);
    
    if (targetUser) {
        targetUser.ws.send(JSON.stringify({
            type: 'ice_candidate',
            from: from,
            candidate: candidate
        }));
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        connectedUsers: connectedUsers.size,
        pendingCalls: pendingCalls.size,
        timestamp: new Date().toISOString()
    });
});

// Get connected users (for debugging)
app.get('/users', (req, res) => {
    const users = Array.from(connectedUsers.keys());
    res.json({ users });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Signaling server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Connected users: http://localhost:${PORT}/users`);
});

// Clean up old connections every 5 minutes
setInterval(() => {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes
    
    for (const [username, user] of connectedUsers.entries()) {
        if (now - user.timestamp > timeout) {
            connectedUsers.delete(username);
            console.log(`Removed stale connection for ${username}`);
        }
    }
    
    // Clean up old pending calls
    for (const [from, call] of pendingCalls.entries()) {
        if (now - call.timestamp > timeout) {
            pendingCalls.delete(from);
            console.log(`Removed stale call request from ${from}`);
        }
    }
}, 5 * 60 * 1000);
