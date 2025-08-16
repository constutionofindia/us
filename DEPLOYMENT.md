# 🚀 **Deploy Your Video Call Signaling Server**

This guide will help you deploy the signaling server so your video calls work over the internet between two different devices!

## 🌐 **What This Enables:**

- ✅ **Real video calls** between two devices over the internet
- ✅ **Call notifications** when one person calls the other
- ✅ **Accept/reject calls** with beautiful UI
- ✅ **Live video and audio** streaming
- ✅ **Mute/unmute** and **video on/off** controls

## 🎯 **Deployment Options:**

### **Option 1: Heroku (Recommended - Free & Easy)**

1. **Create Heroku Account:**
   - Go to [heroku.com](https://heroku.com) and sign up

2. **Install Heroku CLI:**
   ```bash
   # Windows
   Download from: https://devcenter.heroku.com/articles/heroku-cli
   
   # Mac/Linux
   curl https://cli-assets.heroku.com/install.sh | sh
   ```

3. **Deploy to Heroku:**
   ```bash
   # Login to Heroku
   heroku login
   
   # Create new app
   heroku create your-couple-app-name
   
   # Add git remote
   git remote add heroku https://git.heroku.com/your-couple-app-name.git
   
   # Deploy
   git add .
   git commit -m "Add signaling server"
   git push heroku main
   ```

4. **Update Website:**
   - Replace `SIGNALING_SERVER` in `script.js` with your Heroku URL:
   ```javascript
   const SIGNALING_SERVER = 'wss://your-couple-app-name.herokuapp.com';
   ```

### **Option 2: Vercel (Free & Fast)**

1. **Create Vercel Account:**
   - Go to [vercel.com](https://vercel.com) and sign up

2. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

3. **Deploy:**
   ```bash
   vercel
   # Follow the prompts
   ```

4. **Update Website:**
   - Replace `SIGNALING_SERVER` with your Vercel URL

### **Option 3: Railway (Free Tier)**

1. **Create Railway Account:**
   - Go to [railway.app](https://railway.app) and sign up

2. **Connect GitHub:**
   - Push your code to GitHub
   - Connect Railway to your GitHub repo

3. **Deploy:**
   - Railway will automatically deploy from your GitHub repo

4. **Update Website:**
   - Replace `SIGNALING_SERVER` with your Railway URL

## 🔧 **Local Testing (Before Deployment):**

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Locally:**
   ```bash
   npm start
   ```

3. **Test:**
   - Open `http://localhost:3000/health` in browser
   - Should see: `{"status":"ok","connectedUsers":0,"pendingCalls":0}`

## 📱 **How Video Calls Work:**

### **Call Flow:**
1. **User A** clicks "Call Sonam" → Sends call request to server
2. **Server** notifies **Sonam** that she's receiving a call
3. **Sonam** sees incoming call popup with Accept/Reject buttons
4. **If accepted** → Both users connect via WebRTC
5. **Real-time video/audio** flows between their devices

### **Features:**
- 📞 **Call notifications** with ringtone
- ✅ **Accept/Reject** calls
- 🎥 **Live video streaming**
- 🔊 **Real-time audio**
- 🔇 **Mute/Unmute** controls
- 📹 **Video On/Off** controls
- ❌ **End call** functionality

## 🌍 **After Deployment:**

1. **Update `script.js`:**
   ```javascript
   const SIGNALING_SERVER = 'wss://your-deployed-url.com';
   ```

2. **Test with two devices:**
   - Open website on your phone
   - Open website on your computer
   - Login with different accounts
   - Try making a video call!

## 🚨 **Troubleshooting:**

### **Common Issues:**

1. **"WebSocket connection failed":**
   - Check if signaling server is running
   - Verify the URL in `script.js`

2. **"Camera access denied":**
   - Allow camera/microphone permissions in browser
   - Check browser settings

3. **"Call not connecting":**
   - Ensure both users are logged in
   - Check browser console for errors

### **Debug Commands:**
```bash
# Check server status
curl https://your-app.herokuapp.com/health

# Check connected users
curl https://your-app.herokuapp.com/users

# View server logs
heroku logs --tail
```

## 💡 **Advanced Features (Future):**

- 📱 **Push notifications** for incoming calls
- 🎵 **Custom ringtones**
- 📸 **Call recording**
- 👥 **Group video calls**
- 💬 **Call chat** during video calls

## 🎉 **You're Ready!**

Once deployed, your couple's website will have **fully functional video calls** that work over the internet! 

**Puspender** can call **Sonam** from anywhere in the world, and she'll get a beautiful notification to accept or reject the call. When accepted, they'll have real-time video and audio communication! 💕📞

---

**Need Help?** Check the browser console for errors and ensure your signaling server is running and accessible!
