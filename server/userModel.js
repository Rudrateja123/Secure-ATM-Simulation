const mongoose = require('mongoose');

// --- Mongoose Schema and Model ---
const userSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    pattern: { type: [String], required: true },
    duressPin: { type: String, required: true },
    balance: { type: Number, default: 50000 },
    transactionHistory: [{
        type: { type: String, enum: ['debit', 'credit'] },
        amount: Number,
        desc: String,
        date: { type: Date, default: Date.now }
    }]
});

const User = mongoose.model('User', userSchema);

module.exports = User;
