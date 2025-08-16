// User credentials
const users = {
    'puspender': { password: '12345', name: 'Puspender' },
    'sonam': { password: '67890', name: 'Sonam' }
};

let currentUser = null;
let currentUserType = null;
let loveQuestionCount = 0;
let isTimerRunning = false;
let timerInterval = null;
let timerSeconds = 0;
let targetDate = null;
let timerTitle = '';

// WebRTC variables for real video calls
let localStream;
let remoteStream;
let peerConnection;
let isInCall = false;
let isCallActive = false;
let currentCallPartner = null;
let signalingConnection = null;

// Signaling server configuration
const SIGNALING_SERVER = 'wss://your-signaling-server.herokuapp.com'; // You'll need to deploy this
const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
];

// Love question variations for Sonam
const loveQuestions = [
    "Do you love me? 💕",
    "Are you sure you don't love me? 🥺",
    "Really? Not even a little bit? 💔",
    "Think about it again... do you love me? 🤔",
    "Come on, you know you do! Do you love me? 😊",
    "Last chance... do you love me? 🥹",
    "Pretty please? Do you love me? 🥺",
    "I'll keep asking... do you love me? 💝",
    "You're making me sad... do you love me? 😢",
    "I believe in us! Do you love me? 💖",
    "My heart is breaking... do you love me? 💔",
    "I'll never give up... do you love me? 💪",
    "You're my everything... do you love me? 🌟",
    "I'm waiting for you... do you love me? ⏰",
    "Forever and always... do you love me? 💫"
];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
        initializeSignaling();
    }
});

// Initialize signaling connection
function initializeSignaling() {
    try {
        // For demo purposes, we'll use a mock signaling system
        // In production, you'd connect to a real WebSocket server
        console.log('Initializing signaling system...');
        setupMockSignaling();
    } catch (error) {
        console.error('Signaling initialization failed:', error);
    }
}

// Mock signaling system for demo (replace with real WebSocket server)
function setupMockSignaling() {
    // Simulate signaling server behavior
    window.mockSignaling = {
        sendCallRequest: function(toUser) {
            console.log(`Call request sent to ${toUser}`);
            // Simulate call notification after 2 seconds
            setTimeout(() => {
                if (toUser === 'sonam' && currentUser.username === 'puspender') {
                    showIncomingCall('puspender');
                } else if (toUser === 'puspender' && currentUser.username === 'sonam') {
                    showIncomingCall('sonam');
                }
            }, 2000);
        },
        acceptCall: function(fromUser) {
            console.log(`Call accepted from ${fromUser}`);
            establishCall(fromUser);
        },
        rejectCall: function(fromUser) {
            console.log(`Call rejected from ${fromUser}`);
            hideIncomingCall();
        }
    };
}

// Show incoming call notification
function showIncomingCall(fromUser) {
    const incomingCallHTML = `
        <div class="incoming-call" id="incomingCall">
            <div class="call-notification">
                <h2>📞 Incoming Call</h2>
                <p>${users[fromUser].name} is calling you...</p>
                <div class="call-actions">
                    <button class="accept-call" onclick="acceptCall('${fromUser}')">✅ Accept</button>
                    <button class="reject-call" onclick="rejectCall('${fromUser}')">❌ Reject</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', incomingCallHTML);
    document.getElementById('incomingCall').style.display = 'flex';
    
    // Add ringtone effect
    playRingtone();
}

// Hide incoming call notification
function hideIncomingCall() {
    const incomingCall = document.getElementById('incomingCall');
    if (incomingCall) {
        incomingCall.remove();
    }
    stopRingtone();
}

// Play ringtone
function playRingtone() {
    // Create audio context for ringtone
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 1);
    
    // Repeat ringtone
    window.ringtoneInterval = setInterval(() => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.setValueAtTime(800, audioContext.currentTime);
        osc.frequency.setValueAtTime(600, audioContext.currentTime + 0.5);
        
        gain.gain.setValueAtTime(0.3, audioContext.currentTime);
        
        osc.start();
        osc.stop(audioContext.currentTime + 1);
    }, 1000);
}

// Stop ringtone
function stopRingtone() {
    if (window.ringtoneInterval) {
        clearInterval(window.ringtoneInterval);
        window.ringtoneInterval = null;
    }
}

// Accept incoming call
function acceptCall(fromUser) {
    hideIncomingCall();
    currentCallPartner = fromUser;
    showVideoCall();
    startVideoCall();
}

// Establish call connection
function establishCall(partner) {
    currentCallPartner = partner;
    showVideoCall();
    startVideoCall();
}

// Reject incoming call
function rejectCall(fromUser) {
    hideIncomingCall();
    // Notify the caller that call was rejected
    if (window.mockSignaling) {
        window.mockSignaling.callRejected(fromUser);
    }
}

// Login function
function login() {
    const username = document.getElementById('username').value.toLowerCase();
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    if (users[username] && users[username].password === password) {
        currentUser = { username, name: users[username].name };
        currentUserType = username === 'sonam' ? 'girlfriend' : 'boyfriend';
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Hide login form
        document.querySelector('.container').style.display = 'none';
        
        // Initialize signaling after login
        initializeSignaling();
        
        // Show love question for Sonam first
        if (username === 'sonam') {
            showLoveQuestion();
        } else {
            showDashboard();
        }
        
        errorMessage.textContent = '';
        
        // Show communication container after successful login
        document.querySelector('.communication-container').style.display = 'block';
    } else {
        errorMessage.textContent = 'Invalid username or password!';
    }
}

// Show love question for Sonam
function showLoveQuestion() {
    const questionIndex = Math.min(loveQuestionCount, loveQuestions.length - 1);
    const question = loveQuestions[questionIndex];
    
    const loveQuestionHTML = `
        <div class="love-question" id="loveQuestion">
            <div class="love-question-content">
                <h2>${question}</h2>
                <div class="love-buttons">
                    <button class="love-btn yes-btn" onclick="handleLoveAnswer(true)">Yes, I love you! 💕</button>
                    <button class="love-btn no-btn" onclick="handleLoveAnswer(false)">No 💔</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', loveQuestionHTML);
    document.getElementById('loveQuestion').style.display = 'flex';
}

// Handle love answer
function handleLoveAnswer(answer) {
    if (answer) {
        // She said yes!
        const loveQuestion = document.getElementById('loveQuestion');
        loveQuestion.innerHTML = `
            <div class="love-question-content">
                <h2>💕 I knew this 😘 I love you too! 💕</h2>
                <p>Now let's spend time together 💖</p>
                <button class="love-btn yes-btn" onclick="proceedToDashboard()">Continue to Our Special Place 💖</button>
            </div>
        `;
    } else {
        // She said no, ask again with different style
        loveQuestionCount++;
        const loveQuestion = document.getElementById('loveQuestion');
        loveQuestion.remove();
        showLoveQuestion();
    }
}

// Proceed to dashboard after love confirmation
function proceedToDashboard() {
    document.getElementById('loveQuestion').remove();
    showDashboard();
}

// Show main dashboard
function showDashboard() {
    const dashboardHTML = `
        <div class="dashboard" id="dashboard">
            <div class="dashboard-header">
                <h1>Welcome back, ${currentUser.name}! 💕</h1>
                <p>What would you like to do today?</p>
                <button onclick="logout()" style="background: #e74c3c; color: white; border: none; padding: 8px 16px; border-radius: 10px; cursor: pointer; margin-top: 10px;">Logout</button>
            </div>
            
            <div class="options-grid">
                <div class="option-card" onclick="showFeature('chat')">
                    <div class="option-icon">💬</div>
                    <h3>Chat Together</h3>
                    <p>Send sweet messages to each other</p>
                </div>
                
                <div class="option-card" onclick="showFeature('notes')">
                    <div class="option-icon">📝</div>
                    <h3>Love Notes</h3>
                    <p>Write and save special notes</p>
                </div>
                
                <div class="option-card" onclick="showFeature('timer')">
                    <div class="option-icon">⏰</div>
                    <h3>Special Countdown</h3>
                    <p>Countdown to our special moments</p>
                </div>
                
                <div class="option-card" onclick="showFeature('video')">
                    <div class="option-icon">📹</div>
                    <h3>Video Call</h3>
                    <p>See each other face to face</p>
                </div>
                
                <div class="option-card" onclick="showFeature('memories')">
                    <div class="option-icon">💭</div>
                    <h3>Our Memories</h3>
                    <p>Relive our beautiful moments</p>
                </div>
                
                <div class="option-card" onclick="showFeature('wishes')">
                    <div class="option-icon">✨</div>
                    <h3>Wish Wall</h3>
                    <p>Share your dreams and wishes</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', dashboardHTML);
    document.getElementById('dashboard').style.display = 'block';
}

// Show specific feature
function showFeature(feature) {
    document.getElementById('dashboard').style.display = 'none';
    
    switch(feature) {
        case 'chat':
            showChat();
            break;
        case 'notes':
            showNotes();
            break;
        case 'timer':
            showTimer();
            break;
        case 'video':
            showVideoCall();
            break;
        case 'memories':
            showMemories();
            break;
        case 'wishes':
            showWishes();
            break;
    }
}

// Show chat feature
function showChat() {
    const chatHTML = `
        <div class="feature-page" id="chatPage">
            <div class="feature-header">
                <h1>💬 Our Special Chat 💬</h1>
                <p>Send sweet messages to each other</p>
            </div>
            
            <button class="back-btn" onclick="backToDashboard()">← Back to Dashboard</button>
            
            <div class="chat-container">
                <div class="chat-messages" id="chatMessages">
                    ${loadChatMessages()}
                </div>
                <div class="chat-input">
                    <input type="text" id="messageInput" placeholder="Type your sweet message..." onkeypress="handleMessageKeyPress(event)">
                    <button onclick="sendMessage()">Send 💕</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', chatHTML);
    document.getElementById('chatPage').style.display = 'block';
    scrollToBottom();
}

// Show notes feature
function showNotes() {
    const notesHTML = `
        <div class="feature-page" id="notesPage">
            <div class="feature-header">
                <h1>📝 Our Love Notes 📝</h1>
                <p>Write and save special notes for each other</p>
            </div>
            
            <button class="back-btn" onclick="backToDashboard()">← Back to Dashboard</button>
            
            <div class="notes-container">
                <div class="note-input">
                    <textarea id="noteText" placeholder="Write your special note here..."></textarea>
                    <button onclick="saveNote()">Save Note 💕</button>
                </div>
                <div class="notes-list" id="notesList">
                    ${loadNotes()}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', notesHTML);
    document.getElementById('notesPage').style.display = 'block';
}

// Show timer feature with countdown
function showTimer() {
    const timerHTML = `
        <div class="feature-page" id="timerPage">
            <div class="feature-header">
                <h1>⏰ Special Countdown ⏰</h1>
                <p>Countdown to our special moments</p>
            </div>
            
            <button class="back-btn" onclick="backToDashboard()">← Back to Dashboard</button>
            
            <div class="timer-container">
                <div class="countdown-setup">
                    <h3>Set New Countdown</h3>
                    <input type="text" id="timerTitle" placeholder="Event title (e.g., Our Anniversary)" style="width: 100%; padding: 12px; margin: 10px 0; border: 2px solid #ffd3d3; border-radius: 15px; font-size: 16px;">
                    <input type="datetime-local" id="timerDate" style="width: 100%; padding: 12px; margin: 10px 0; border: 2px solid #ffd3d3; border-radius: 15px; font-size: 16px;">
                    <button onclick="setCountdown()" style="background: #9b59b6; color: white; border: none; padding: 12px 25px; border-radius: 15px; cursor: pointer; margin: 10px 0; width: 100%;">Set Countdown ✨</button>
                </div>
                
                <div class="countdown-display" id="countdownDisplay" style="display: none;">
                    <h3 id="countdownTitle" style="color: #c44569; margin: 20px 0;"></h3>
                    <div class="timer-display" id="timerDisplay">00:00:00:00</div>
                    <div class="timer-controls">
                        <button class="timer-btn start-btn" onclick="startCountdown()">Start Countdown ⏰</button>
                        <button class="timer-btn pause-btn" onclick="pauseCountdown()">Pause ⏸️</button>
                        <button class="timer-btn reset-btn" onclick="resetCountdown()">Reset 🔄</button>
                    </div>
                </div>
                
                <div class="saved-countdowns" id="savedCountdowns">
                    <h3>Saved Countdowns</h3>
                    ${loadSavedCountdowns()}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', timerHTML);
    document.getElementById('timerPage').style.display = 'block';
    loadCurrentCountdown();
}

// Show video call feature with real calling system
function showVideoCall() {
    const videoHTML = `
        <div class="feature-page" id="videoPage">
            <div class="feature-header">
                <h1>📹 Video Call 📹</h1>
                <p>Call your partner and see each other face to face</p>
            </div>
            
            <button class="back-btn" onclick="backToDashboard()">← Back to Dashboard</button>
            
            <div class="video-container">
                <div class="call-actions" id="callActions">
                    <h3>Make a Call</h3>
                    <p>Choose who you want to call:</p>
                    <div class="call-buttons">
                        <button class="call-btn primary" onclick="initiateCall('sonam')" ${currentUser.username === 'sonam' ? 'disabled' : ''}>
                            📞 Call Sonam
                        </button>
                        <button class="call-btn primary" onclick="initiateCall('puspender')" ${currentUser.username === 'puspender' ? 'disabled' : ''}>
                            📞 Call Puspender
                        </button>
                    </div>
                    <div class="call-status" id="callStatus">
                        <p>Ready to make calls! 💕</p>
                    </div>
                </div>
                
                <div class="video-grid" id="videoGrid" style="display: none;">
                    <div class="video-item">
                        <video id="localVideo" autoplay muted playsinline></video>
                        <div class="video-label">You (${currentUser.name})</div>
                    </div>
                    <div class="video-item">
                        <video id="remoteVideo" autoplay playsinline></video>
                        <div class="video-label">Partner</div>
                    </div>
                </div>
                
                <div class="video-controls" id="videoControls" style="display: none;">
                    <button class="video-btn mute-btn" onclick="toggleMute()" id="muteBtn">🔇 Mute</button>
                    <button class="video-btn video-btn" onclick="toggleVideo()" id="videoBtn">📹 Video Off</button>
                    <button class="video-btn end-btn" onclick="endVideoCall()">End Call ❌</button>
                </div>
                
                <div class="connection-info" id="connectionInfo">
                    <p><strong>How it works:</strong></p>
                    <p>1. Click "Call [Partner]" to initiate a call</p>
                    <p>2. Your partner will receive a call notification</p>
                    <p>3. When they accept, you'll connect via video</p>
                    <p>4. Use the controls to mute, turn off video, or end call</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', videoHTML);
    document.getElementById('videoPage').style.display = 'block';
}

// Show memories feature
function showMemories() {
    const memoriesHTML = `
        <div class="feature-page" id="memoriesPage">
            <div class="feature-header">
                <h1>💭 Our Special Memories 💭</h1>
                <p>Relive our beautiful moments together</p>
            </div>
            
            <button class="back-btn" onclick="backToDashboard()">← Back to Dashboard</button>
            
            <div class="notes-container">
                <div class="note-input">
                    <textarea id="memoryText" placeholder="Share a special memory..."></textarea>
                    <button onclick="saveMemory()">Save Memory 💕</button>
                </div>
                <div class="notes-list" id="memoriesList">
                    ${loadMemories()}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', memoriesHTML);
    document.getElementById('memoriesPage').style.display = 'block';
}

// Show wishes feature
function showWishes() {
    const wishesHTML = `
        <div class="feature-page" id="wishesPage">
            <div class="feature-header">
                <h1>✨ Our Wish Wall ✨</h1>
                <p>Share your dreams and wishes for us</p>
            </div>
            
            <button class="back-btn" onclick="backToDashboard()">← Back to Dashboard</button>
            
            <div class="notes-container">
                <div class="note-input">
                    <textarea id="wishText" placeholder="Write your wish for us..."></textarea>
                    <button onclick="saveWish()">Make a Wish ✨</button>
                </div>
                <div class="notes-list" id="wishesList">
                    ${loadWishes()}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', wishesHTML);
    document.getElementById('wishesPage').style.display = 'block';
}

// Back to dashboard
function backToDashboard() {
    // Remove current feature page
    const currentPage = document.querySelector('.feature-page');
    if (currentPage) {
        currentPage.remove();
    }
    
    // Show dashboard
    document.getElementById('dashboard').style.display = 'block';
}

// Chat functions
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (message) {
        const messageData = {
            text: message,
            sender: currentUser.name,
            timestamp: new Date().toLocaleString(),
            type: currentUserType
        };
        
        // Save message to localStorage
        const messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
        messages.push(messageData);
        localStorage.setItem('chatMessages', JSON.stringify(messages));
        
        // Display message
        displayMessage(messageData);
        
        // Clear input
        messageInput.value = '';
        scrollToBottom();
    }
}

function handleMessageKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function displayMessage(messageData) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${messageData.type === 'girlfriend' ? 'received' : 'sent'}`;
    messageDiv.innerHTML = `
        <strong>${messageData.sender}</strong><br>
        ${messageData.text}<br>
        <small>${messageData.timestamp}</small>
    `;
    chatMessages.appendChild(messageDiv);
}

function loadChatMessages() {
    const messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
    let html = '';
    
    messages.forEach(message => {
        const messageClass = message.type === 'girlfriend' ? 'received' : 'sent';
        html += `
            <div class="message ${messageClass}">
                <strong>${message.sender}</strong><br>
                ${message.text}<br>
                <small>${message.timestamp}</small>
            </div>
        `;
    });
    
    return html;
}

function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Notes functions
function saveNote() {
    const noteText = document.getElementById('noteText').value.trim();
    
    if (noteText) {
        const noteData = {
            text: noteText,
            author: currentUser.name,
            timestamp: new Date().toLocaleString(),
            type: currentUserType
        };
        
        // Save note to localStorage
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        notes.push(noteData);
        localStorage.setItem('notes', JSON.stringify(notes));
        
        // Clear input and reload notes
        document.getElementById('noteText').value = '';
        document.getElementById('notesList').innerHTML = loadNotes();
    }
}

function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    let html = '';
    
    notes.forEach(note => {
        html += `
            <div class="note-item">
                <h4>${note.author}</h4>
                <p>${note.text}</p>
                <small>${note.timestamp}</small>
            </div>
        `;
    });
    
    return html;
}

// Memories functions
function saveMemory() {
    const memoryText = document.getElementById('memoryText').value.trim();
    
    if (memoryText) {
        const memoryData = {
            text: memoryText,
            author: currentUser.name,
            timestamp: new Date().toLocaleString(),
            type: currentUserType
        };
        
        const memories = JSON.parse(localStorage.getItem('memories') || '[]');
        memories.push(memoryData);
        localStorage.setItem('memories', JSON.stringify(memories));
        
        document.getElementById('memoryText').value = '';
        document.getElementById('memoriesList').innerHTML = loadMemories();
    }
}

function loadMemories() {
    const memories = JSON.parse(localStorage.getItem('memories') || '[]');
    let html = '';
    
    memories.forEach(memory => {
        html += `
            <div class="note-item">
                <h4>${memory.author}</h4>
                <p>${memory.text}</p>
                <small>${memory.timestamp}</small>
            </div>
        `;
    });
    
    return html;
}

// Wishes functions
function saveWish() {
    const wishText = document.getElementById('wishText').value.trim();
    
    if (wishText) {
        const wishData = {
            text: wishText,
            author: currentUser.name,
            timestamp: new Date().toLocaleString(),
            type: currentUserType
        };
        
        const wishes = JSON.parse(localStorage.getItem('wishes') || '[]');
        wishes.push(wishData);
        localStorage.setItem('wishes', JSON.stringify(wishes));
        
        document.getElementById('wishText').value = '';
        document.getElementById('wishesList').innerHTML = loadWishes();
    }
}

function loadWishes() {
    const wishes = JSON.parse(localStorage.getItem('wishes') || '[]');
    let html = '';
    
    wishes.forEach(wish => {
        html += `
            <div class="note-item">
                <h4>${wish.author}</h4>
                <p>${wish.text}</p>
                <small>${wish.timestamp}</small>
            </div>
        `;
    });
    
    return html;
}

// Enhanced Timer/Countdown functions
function setCountdown() {
    const title = document.getElementById('timerTitle').value.trim();
    const dateTime = document.getElementById('timerDate').value;
    
    if (title && dateTime) {
        const targetDate = new Date(dateTime);
        const now = new Date();
        
        if (targetDate > now) {
            const countdownData = {
                title: title,
                targetDate: targetDate.toISOString(),
                createdAt: new Date().toISOString()
            };
            
            // Save to localStorage
            const countdowns = JSON.parse(localStorage.getItem('countdowns') || '[]');
            countdowns.push(countdownData);
            localStorage.setItem('countdowns', JSON.stringify(countdowns));
            
            // Set as current countdown
            localStorage.setItem('currentCountdown', JSON.stringify(countdownData));
            
            // Clear inputs
            document.getElementById('timerTitle').value = '';
            document.getElementById('timerDate').value = '';
            
            // Show countdown
            loadCurrentCountdown();
            alert(`Countdown set for "${title}"! 🎉`);
        } else {
            alert('Please select a future date and time! ⏰');
        }
    } else {
        alert('Please fill in both title and date! 📝');
    }
}

function loadCurrentCountdown() {
    const currentCountdown = JSON.parse(localStorage.getItem('currentCountdown'));
    const countdownDisplay = document.getElementById('countdownDisplay');
    const savedCountdowns = document.getElementById('savedCountdowns');
    
    if (currentCountdown) {
        countdownDisplay.style.display = 'block';
        document.getElementById('countdownTitle').textContent = currentCountdown.title;
        
        // Start countdown automatically
        targetDate = new Date(currentCountdown.targetDate);
        startCountdown();
    } else {
        countdownDisplay.style.display = 'none';
    }
    
    // Reload saved countdowns
    if (savedCountdowns) {
        savedCountdowns.innerHTML = `<h3>Saved Countdowns</h3>${loadSavedCountdowns()}`;
    }
}

function loadSavedCountdowns() {
    const countdowns = JSON.parse(localStorage.getItem('countdowns') || '[]');
    let html = '';
    
    countdowns.forEach((countdown, index) => {
        const targetDate = new Date(countdown.targetDate);
        const now = new Date();
        const timeLeft = targetDate - now;
        
        if (timeLeft > 0) {
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            
            html += `
                <div class="note-item">
                    <h4>${countdown.title}</h4>
                    <p>${days} days, ${hours} hours, ${minutes} minutes left</p>
                    <small>Target: ${targetDate.toLocaleString()}</small>
                    <button onclick="setAsCurrentCountdown(${index})" style="background: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 8px; cursor: pointer; margin-top: 10px;">Set as Current</button>
                </div>
            `;
        }
    });
    
    return html;
}

function setAsCurrentCountdown(index) {
    const countdowns = JSON.parse(localStorage.getItem('countdowns') || '[]');
    if (countdowns[index]) {
        localStorage.setItem('currentCountdown', JSON.stringify(countdowns[index]));
        loadCurrentCountdown();
    }
}

function startCountdown() {
    if (!isTimerRunning && targetDate) {
        isTimerRunning = true;
        timerInterval = setInterval(updateCountdown, 1000);
    }
}

function pauseCountdown() {
    isTimerRunning = false;
    clearInterval(timerInterval);
}

function updateCountdown() {
    if (targetDate) {
        const now = new Date();
        const timeLeft = targetDate - now;
        
        if (timeLeft > 0) {
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            const display = document.getElementById('timerDisplay');
            if (display) {
                display.textContent = `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        } else {
            pauseCountdown();
            alert('🎉 Countdown completed! The special moment has arrived! 💕');
        }
    }
}

// Video Call Functions
async function initiateCall(toUser) {
    try {
        // Update UI to show calling status
        document.getElementById('callStatus').innerHTML = `
            <p>📞 Calling ${users[toUser].name}...</p>
            <div class="calling-animation">⏳</div>
        `;
        
        // Send call request through signaling
        if (window.mockSignaling) {
            window.mockSignaling.sendCallRequest(toUser);
        }
        
        // Wait for call to be accepted/rejected
        setTimeout(() => {
            // Simulate call acceptance for demo
            if (Math.random() > 0.3) { // 70% chance of acceptance
                callAccepted(toUser);
            } else {
                callRejected(toUser);
            }
        }, 3000);
        
    } catch (error) {
        console.error('Error initiating call:', error);
        document.getElementById('callStatus').innerHTML = `
            <p>❌ Failed to initiate call. Please try again.</p>
        `;
    }
}

function callAccepted(partner) {
    currentCallPartner = partner;
    document.getElementById('callStatus').innerHTML = `
        <p>✅ ${users[partner].name} accepted your call!</p>
        <p>Connecting...</p>
    `;
    
    // Start the actual video call
    setTimeout(() => {
        startVideoCall();
    }, 1000);
}

function callRejected(partner) {
    document.getElementById('callStatus').innerHTML = `
        <p>❌ ${users[partner].name} rejected your call</p>
        <button onclick="resetCallStatus()">Try Again</button>
    `;
}

function resetCallStatus() {
    document.getElementById('callStatus').innerHTML = `
        <p>Ready to make calls! 💕</p>
    `;
}

// WebRTC Video Call functions
async function startVideoCall() {
    try {
        // Get user media
        localStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
        });
        
        // Display local video
        const localVideo = document.getElementById('localVideo');
        localVideo.srcObject = localStream;
        
        // Create peer connection
        const configuration = {
            iceServers: ICE_SERVERS
        };
        
        peerConnection = new RTCPeerConnection(configuration);
        
        // Add local stream to peer connection
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
        
        // Handle incoming tracks
        peerConnection.ontrack = (event) => {
            const remoteVideo = document.getElementById('remoteVideo');
            remoteVideo.srcObject = event.streams[0];
        };
        
        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                // In a real app, you'd send this to the other peer via signaling server
                console.log('ICE candidate:', event.candidate);
            }
        };
        
        // Show video interface
        document.getElementById('callActions').style.display = 'none';
        document.getElementById('videoGrid').style.display = 'grid';
        document.getElementById('videoControls').style.display = 'flex';
        
        // Update connection info
        document.getElementById('connectionInfo').innerHTML = `
            <p><strong>✅ Connected with ${users[currentCallPartner].name}!</strong></p>
            <p>You can now see and hear each other in real-time.</p>
            <p>Use the controls below to manage your call.</p>
        `;
        
        isInCall = true;
        isCallActive = true;
        
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('❌ Could not access camera. Please check permissions and try again.');
    }
}

function endVideoCall() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    // Clear video elements
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    if (localVideo) localVideo.srcObject = null;
    if (remoteVideo) remoteVideo.srcObject = null;
    
    // Reset UI to call actions
    document.getElementById('videoGrid').style.display = 'none';
    document.getElementById('videoControls').style.display = 'none';
    document.getElementById('callActions').style.display = 'block';
    document.getElementById('callStatus').innerHTML = `
        <p>Call ended. Ready to make new calls! 💕</p>
    `;
    
    // Update connection info
    document.getElementById('connectionInfo').innerHTML = `
        <p><strong>How it works:</strong></p>
        <p>1. Click "Call [Partner]" to initiate a call</p>
        <p>2. Your partner will receive a call notification</p>
        <p>3. When they accept, you'll connect via video</p>
        <p>4. Use the controls to mute, turn off video, or end call</p>
    `;
    
    isInCall = false;
    isCallActive = false;
    currentCallPartner = null;
}

// Toggle mute/unmute
function toggleMute() {
    if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            const muteBtn = document.getElementById('muteBtn');
            if (audioTrack.enabled) {
                muteBtn.textContent = '🔇 Mute';
                muteBtn.style.background = 'linear-gradient(45deg, #f39c12, #e67e22)';
            } else {
                muteBtn.textContent = '🔊 Unmute';
                muteBtn.style.background = 'linear-gradient(45deg, #e74c3c, #c0392b)';
            }
        }
    }
}

// Toggle video on/off
function toggleVideo() {
    if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            const videoBtn = document.getElementById('videoBtn');
            if (videoTrack.enabled) {
                videoBtn.textContent = '📹 Video Off';
                videoBtn.style.background = 'linear-gradient(45deg, #f39c12, #e67e22)';
            } else {
                videoBtn.textContent = '📹 Video On';
                videoBtn.style.background = 'linear-gradient(45deg, #e74c3c, #c0392b)';
            }
        }
    }
}

// Logout function
function logout() {
    // End video call if active
    if (isInCall) {
        endVideoCall();
    }
    
    currentUser = null;
    currentUserType = null;
    loveQuestionCount = 0;
    localStorage.removeItem('currentUser');
    
    // Remove all pages
    const pages = document.querySelectorAll('.dashboard, .feature-page, .love-question');
    pages.forEach(page => page.remove());
    
    // Show login form
    document.querySelector('.container').style.display = 'flex';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('error-message').textContent = '';
}

// WebSocket and Media functions
async function initializeMedia() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        });
        document.getElementById('localVideo').srcObject = localStream;
    } catch (err) {
        console.error('Media access error:', err);
    }
}

document.getElementById('startCall').addEventListener('click', initializeMedia);

// Add WebSocket connection
const ws = new WebSocket('YOUR_WEBSOCKET_SERVER_URL');

ws.onmessage = function(event) {
    // Handle incoming messages
    console.log('Message received:', event.data);
};

const configuration = {
    iceServers: [{
        urls: 'stun:stun.l.google.com:19302'
    }]
};

let localStream;
let peerConnection;
let ws;

function initializeWebSocket() {
    ws = new WebSocket('wss://your-websocket-server.com');
    
    ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        switch(data.type) {
            case 'offer':
                handleOffer(data);
                break;
            case 'answer':
                handleAnswer(data);
                break;
            case 'ice-candidate':
                handleIceCandidate(data);
                break;
            case 'chat':
                displayMessage(data);
                break;
        }
    };
}

async function startCall() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        });
        document.getElementById('localVideo').srcObject = localStream;
        
        peerConnection = new RTCPeerConnection(configuration);
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
        
        peerConnection.ontrack = event => {
            document.getElementById('remoteVideo').srcObject = event.streams[0];
        };
        
        createAndSendOffer();
    } catch (err) {
        console.error('Error starting call:', err);
    }
}

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === 'demo' && password === 'demo') {
        document.querySelector('.login-container').style.display = 'none';
        document.querySelector('.communication-container').style.display = 'block';
        initializeWebSocket();
    } else {
        document.getElementById('error-message').textContent = 'Invalid credentials';
    }
}

document.getElementById('startCall').addEventListener('click', startCall);
document.getElementById('startChat').addEventListener('click', () => {
    const message = prompt('Enter your message:');
    if (message) {
        ws.send(JSON.stringify({
            type: 'chat',
            message: message
        }));
    }
});

function displayMessage(data) {
    const chatBox = document.getElementById('chatBox');
    const messageDiv = document.createElement('div');
    messageDiv.textContent = `${data.sender}: ${data.message}`;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

