// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const User = require('./userModel'); // Import the User model

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- Database Connection ---
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected successfully."))
.catch(err => console.error("MongoDB connection error:", err));

// --- API Endpoints ---

app.post('/api/register', async (req, res) => {
    try {
        const { name, pattern, duressPin } = req.body;
        if (!name || !pattern || !duressPin) {
            return res.status(400).json({ message: "All fields are required." });
        }
        const existingUser = await User.findOne({ name });
        if (existingUser) {
            return res.status(400).json({ message: "User with this name already exists." });
        }
        const newUser = new User({ name, pattern, duressPin });
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ message: "Server error during registration.", error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { name } = req.body;
        const user = await User.findOne({ name });
        if (!user) {
            return res.status(404).json({ message: "User not found. Please register first." });
        }
        const grid = Array.from({ length: 9 }, () => 
            Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))
        );
        let dynamicPin = '';
        user.pattern.forEach(pos => {
            const [r, c] = pos.split(',').map(Number);
            dynamicPin += grid[r][c];
        });
        res.json({
            user: { _id: user._id, name: user.name, balance: user.balance, transactionHistory: user.transactionHistory, duressPin: user.duressPin },
            grid: grid,
            dynamicPin: dynamicPin 
        });
    } catch (error) {
        res.status(500).json({ message: "Server error during login.", error: error.message });
    }
});

app.post('/api/transaction', async (req, res) => {
    try {
        const { userId, type, amount, isDuress } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        if (type === 'debit') {
            if (isDuress) {
                 if (amount > 1000) {
                    return res.status(400).json({ message: "Duress withdrawal cannot exceed ₹1,000." });
                 }
                 console.log(`DURESS ALERT: Withdrawal of ₹${amount} by ${user.name}`);
            }
            if (user.balance < amount) {
                return res.status(400).json({ message: "Insufficient funds." });
            }
            user.balance -= amount;
            user.transactionHistory.push({ type: 'debit', amount, desc: `ATM Withdrawal ${isDuress ? '(DURESS)' : ''}` });
        } else if (type === 'credit') {
            user.balance += amount;
            user.transactionHistory.push({ type: 'credit', amount, desc: 'ATM Deposit' });
        }
        await user.save();
        let response = { newBalance: user.balance };
        if(isDuress) {
            response.fakeBalance = (Math.floor(Math.random() * 1501) + 1000) - amount;
        }
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: "Server error during transaction.", error: error.message });
    }
});

app.post('/api/financial-advice', async (req, res) => {
    const { prompt } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

    try {
        const response = await axios.post(apiUrl, {
            contents: [{ parts: [{ text: prompt }] }]
        });
        res.json({ text: response.data.candidates[0].content.parts[0].text });
    } catch (error) {
        console.error("Error calling Gemini API:", error.response ? error.response.data : error.message);
        res.status(500).json({ message: "Failed to get financial advice." });
    }
});

app.post('/api/tts', async (req, res) => {
    const { text } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const ttsApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`;
    
    const payload = {
        contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } }
        },
        model: "gemini-2.5-flash-preview-tts"
    };

    try {
        const response = await axios.post(ttsApiUrl, payload);
        const audioData = response.data.candidates[0].content.parts[0].inlineData.data;
        const mimeType = response.data.candidates[0].content.parts[0].inlineData.mimeType;
        res.json({ audioData, mimeType });
    } catch (error) {
        console.error("Error calling TTS API:", error.response ? error.response.data : error.message);
        res.status(500).json({ message: "Failed to generate speech." });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

