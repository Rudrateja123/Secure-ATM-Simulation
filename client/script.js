document.addEventListener('DOMContentLoaded', () => {

    // --- 1. GLOBAL STATE & SETUP ---
    const API_BASE_URL = 'http://localhost:5000';
    let currentUser = null;
    let correctDynamicPin = '';
    let enteredPin = '';
    let temporaryPattern = [];
    let isDuressMode = false;
    let fakeBalance = 0;
    let isTTSBusy = false;

    const colorPattern = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#073b4c', '#f78c6b', '#82d173', '#7d5ba6', '#f94144'];

    // --- 2. UI & HELPER FUNCTIONS ---
    const showScreen = (screenId) => {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    };

    const resetToHome = () => {
        currentUser = null;
        enteredPin = '';
        temporaryPattern = [];
        isDuressMode = false;
        fakeBalance = 0;
        document.getElementById('pin-display').style.visibility = 'hidden';
        document.getElementById('pin-display').textContent = '';
        document.getElementById('user-name-input').value = '';
        showScreen('welcome-screen');
    };

    const createGrid = (container, isSetupMode, showNumbers, gridData = null) => {
        container.innerHTML = '';
        
        for (let i = 0; i < 9; i++) {
            const subgrid = document.createElement('div');
            subgrid.classList.add('subgrid');

            for (let j = 0; j < 9; j++) {
                const r = Math.floor(i / 3) * 3 + Math.floor(j / 3);
                const c = (i % 3) * 3 + (j % 3);

                const cell = document.createElement('div');
                cell.classList.add('grid-cell');
                const colorIndex = (r % 3) * 3 + (c % 3);
                cell.style.backgroundColor = colorPattern[colorIndex];
                cell.style.animationDelay = `${r * 40 + c * 10}ms`;

                if (showNumbers && gridData) {
                    cell.dataset.content = gridData[r][c];
                }
                
                cell.dataset.pos = `${r},${c}`;
                if (isSetupMode) {
                    cell.classList.add('setup-mode');
                    cell.addEventListener('click', () => handleCellSelection(cell, `${r},${c}`));
                }
                subgrid.appendChild(cell);
            }
            container.appendChild(subgrid);
        }
    };
    
    const showReceipt = (type, amountStr, isDuress = false) => {
        const now = new Date();
        document.getElementById('receipt-date').textContent = now.toLocaleDateString();
        document.getElementById('receipt-time').textContent = now.toLocaleTimeString();
        document.getElementById('receipt-type').textContent = type;
        document.getElementById('receipt-amount').textContent = amountStr;
        
        const balance = isDuress ? fakeBalance : currentUser.balance;
        document.getElementById('receipt-balance').textContent = `₹ ${balance.toLocaleString()}`;
        showScreen('receipt-screen');
    };

    // --- 3. API & AI FUNCTIONS ---
    const loadingSpinner = document.getElementById('loading-spinner');

    async function callGemini(prompt) {
        loadingSpinner.style.display = 'block';
        document.getElementById('ai-result-display').textContent = 'Thinking...';
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/financial-advice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            document.getElementById('ai-result-display').textContent = result.text;
        } catch (error) {
            console.error("AI call failed:", error);
            document.getElementById('ai-result-display').textContent = 'An error occurred. Please check the console.';
        } finally {
            loadingSpinner.style.display = 'none';
        }
    }

    function analyzeSpending() {
        const transactions = currentUser.transactionHistory.map(t => `${t.type} of ${t.amount} for ${t.desc}`).join(', ');
        const prompt = `I am a bank customer in India. My current balance is ₹${currentUser.balance}. My recent transactions are: ${transactions}. Based on this, provide a brief, friendly analysis of my spending habits in 2-3 sentences and give me one actionable savings tip. Keep the tone encouraging.`;
        callGemini(prompt);
    }

    function createSavingsPlan() {
        const goalName = document.getElementById('savings-goal-name').value;
        const goalAmount = document.getElementById('savings-goal-amount').value;
        if (!goalName || !goalAmount) {
            alert("Please enter both a goal name and amount.");
            return;
        }
        const prompt = `I am a bank customer in India. My current balance is ₹${currentUser.balance}. I want to save up ₹${goalAmount} for a "${goalName}". Create a simple, encouraging savings plan with 3-4 actionable steps I can take. Keep the tone positive and motivational.`;
        callGemini(prompt);
    }
    
    function base64ToArrayBuffer(base64) {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    function pcmToWav(pcmData, sampleRate) {
        const header = new ArrayBuffer(44);
        const view = new DataView(header);
        const numSamples = pcmData.length;
        const numChannels = 1;
        const bitsPerSample = 16;
        const byteRate = sampleRate * numChannels * bitsPerSample / 8;
        const blockAlign = numChannels * bitsPerSample / 8;
        
        view.setUint32(0, 1380533830, false);
        view.setUint32(4, 36 + numSamples * 2, true);
        view.setUint32(8, 1463899717, false);
        view.setUint32(12, 1718449184, false);
        view.setUint32(16, 16, true);
        view.setUint32(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitsPerSample, true);
        view.setUint32(36, 1684108385, false);
        view.setUint32(40, numSamples * 2, true);

        return new Blob([view.buffer, pcmData.buffer], { type: 'audio/wav' });
    }

    async function textToSpeech(textToRead) {
        if (!textToRead || isTTSBusy) return;
        isTTSBusy = true; 
        loadingSpinner.style.display = 'block';
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: textToRead })
            });
            if (!response.ok) throw new Error(`TTS HTTP error! status: ${response.status}`);
            
            const result = await response.json();
            const audioData = result.audioData;
            const mimeType = result.mimeType;

            if (audioData && mimeType) {
                const sampleRateMatch = mimeType.match(/rate=(\d+)/);
                if (!sampleRateMatch) throw new Error("Sample rate not found in mimeType");
                const sampleRate = parseInt(sampleRateMatch[1], 10);
                const pcmBuffer = base64ToArrayBuffer(audioData);
                const pcm16 = new Int16Array(pcmBuffer);
                const wavBlob = pcmToWav(pcm16, sampleRate);
                const audioUrl = URL.createObjectURL(wavBlob);
                new Audio(audioUrl).play();
            } else { throw new Error("Invalid TTS response from server"); }
        } catch (error) {
            console.error("TTS call failed:", error);
            alert("Text-to-speech service is unavailable.");
        } finally {
            loadingSpinner.style.display = 'none';
            isTTSBusy = false;
        }
    }


    // --- 4. SETUP & LOGIN FLOWS ---
    const startSetupFlow = () => {
        const userName = document.getElementById('user-name-input').value;
        if (!userName) {
            alert("Please enter your name to set up a new card.");
            return;
        }
        currentUser = { name: userName };
        temporaryPattern = [];
        document.getElementById('setup-instructions').textContent = 'Select 4 positions on the grid. (0/4 selected)';
        document.getElementById('confirm-pattern-btn').disabled = true;
        createGrid(document.getElementById('setup-grid-container'), true, false);
        showScreen('setup-screen');
    };

    const handleCellSelection = (cell, pos) => {
        const index = temporaryPattern.indexOf(pos);
        if (index > -1) {
            temporaryPattern.splice(index, 1);
        } else if (temporaryPattern.length < 4) {
            temporaryPattern.push(pos);
        }

        const allCells = document.querySelectorAll('#setup-grid-container .grid-cell');
        allCells.forEach(c => {
            const cPos = c.dataset.pos;
            const patternIndex = temporaryPattern.indexOf(cPos);
            if (patternIndex > -1) {
                c.classList.add('setup-selected');
                c.dataset.content = patternIndex + 1;
            } else {
                c.classList.remove('setup-selected');
                c.dataset.content = '';
            }
        });

        const count = temporaryPattern.length;
        document.getElementById('setup-instructions').textContent = `Select 4 positions on the grid. (${count}/4 selected)`;
        document.getElementById('confirm-pattern-btn').disabled = (count !== 4);
    };

    const saveAllCredentials = async () => {
        const name = currentUser.name;
        const duressPin = document.getElementById('duress-pin-input').value;

        try {
            const response = await fetch(`${API_BASE_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, pattern: temporaryPattern, duressPin })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Registration failed');
            }

            const newUser = await response.json();
            currentUser = newUser;
            showVerificationScreen();
        } catch (error) {
            alert(error.message);
            if (error.message.includes("exists")) {
                resetToHome();
            }
        }
    };
    
    const showVerificationScreen = () => {
        const verificationGrid = document.getElementById('verification-grid-container');
        createGrid(verificationGrid, false, false); 
        
        const allCells = verificationGrid.querySelectorAll('.grid-cell');
        allCells.forEach(cell => {
            const pos = cell.dataset.pos;
            const patternIndex = temporaryPattern.indexOf(pos);
            if(patternIndex > -1) {
                cell.dataset.content = patternIndex + 1;
                cell.classList.add('setup-selected');
            }
        });
        
        document.getElementById('verification-duress-pin').textContent = currentUser.duressPin;
        showScreen('setup-verification-screen');
    };

    const checkLogin = () => {
        if (enteredPin === correctDynamicPin) {
            isDuressMode = false;
            showScreen('menu-screen');
            textToSpeech(`Welcome, ${currentUser.name}`);
        } else if (enteredPin === currentUser.duressPin) {
             isDuressMode = true;
             console.warn(`%c DURESS PIN ALERT! User: ${currentUser.name}.`, "color: red; font-size: 16px;");
             fakeBalance = Math.floor(Math.random() * 1501) + 1000;
             showScreen('menu-screen');
             textToSpeech(`Welcome, ${currentUser.name}`);
        } else {
            alert("Incorrect PIN. The grid will reset.");
            enteredPin = '';
            document.getElementById('pin-display').textContent = '';
            startLoginFlow(); 
        }
    };
    
    // --- 5. EVENT LISTENERS ---
    document.getElementById('new-user-btn').addEventListener('click', startSetupFlow);
    
    const startLoginFlow = async () => {
        const userName = document.getElementById('user-name-input').value;
        if (!userName) {
            alert("Please enter your name to log in.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ name: userName })
            });
            if (!response.ok) {
                 const err = await response.json();
                throw new Error(err.message || 'Login failed');
            }

            const data = await response.json();
            currentUser = data.user;
            correctDynamicPin = data.dynamicPin;
            
            document.getElementById('welcome-user-name').textContent = `Welcome, ${currentUser.name}!`;

            createGrid(document.getElementById('auth-grid-container'), false, true, data.grid);
            document.getElementById('pin-display').style.visibility = 'visible';
            showScreen('auth-screen');

        } catch (error) {
            alert(error.message);
        }
    };

    document.getElementById('existing-user-btn').addEventListener('click', startLoginFlow);
    
    document.getElementById('confirm-pattern-btn').addEventListener('click', () => {
        document.getElementById('duress-pin-input').value = '';
        showScreen('duress-setup-screen');
    });
    
    document.getElementById('duress-pin-input').addEventListener('input', (e) => {
        document.getElementById('confirm-duress-btn').disabled = e.target.value.length !== 4;
    });

    document.getElementById('confirm-duress-btn').addEventListener('click', () => {
        const duressPin = document.getElementById('duress-pin-input').value;
        const weakPins = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234'];
        
        if (weakPins.includes(duressPin)) {
            alert("This Duress PIN is too common. Please choose a different one.");
            return; 
        }
        
        saveAllCredentials();
    });
    
    document.getElementById('cancel-setup-btn').addEventListener('click', resetToHome);
    document.getElementById('verification-ok-btn').addEventListener('click', resetToHome);
    document.getElementById('receipt-ok-btn').addEventListener('click', () => showScreen('menu-screen'));
    
    document.getElementById('ai-insights-btn').addEventListener('click', () => {
        document.getElementById('savings-goal-name').value = '';
        document.getElementById('savings-goal-amount').value = '';
        document.getElementById('ai-result-display').textContent = 'Your AI insights will appear here...';
        showScreen('ai-insights-screen');
    });
    document.getElementById('analyze-spending-btn').addEventListener('click', analyzeSpending);
    document.getElementById('create-savings-plan-btn').addEventListener('click', createSavingsPlan);

    document.getElementById('confirm-withdraw-btn').addEventListener('click', async () => {
        const amountInput = document.getElementById('withdraw-amount');
        const amount = parseInt(amountInput.value);
        if (isNaN(amount) || amount <= 0) {
             alert("Invalid amount.");
             return;
        }
        
        const response = await fetch(`${API_BASE_URL}/api/transaction`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                userId: currentUser._id,
                type: 'debit',
                amount: amount,
                isDuress: isDuressMode
            })
        });

        const result = await response.json();

        if (response.ok) {
            currentUser.balance = result.newBalance;
            if(isDuressMode) {
                fakeBalance = result.fakeBalance;
            }
            showReceipt("Withdrawal", `₹ ${amount.toLocaleString()}`, isDuressMode);
        } else {
            alert(result.message);
        }
        amountInput.value = '';
    });
    
    document.getElementById('deposit-btn').addEventListener('click', () => {
        document.getElementById('deposit-amount').value = '';
        showScreen('deposit-screen');
    });
    
    document.getElementById('confirm-deposit-btn').addEventListener('click', async () => {
        const amountInput = document.getElementById('deposit-amount');
        const amount = parseInt(amountInput.value);
        if (isNaN(amount) || amount <= 0) { alert("Invalid amount."); return; }

        const response = await fetch(`${API_BASE_URL}/api/transaction`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                userId: currentUser._id,
                type: 'credit',
                amount: amount
            })
        });

        const result = await response.json();
        
        if (response.ok) {
             currentUser.balance = result.newBalance;
             showReceipt("Deposit", `₹ ${amount.toLocaleString()}`);
        } else {
            alert(result.message);
        }
        amountInput.value = '';
    });


    document.querySelectorAll('.tts-icon').forEach(icon => {
        icon.addEventListener('click', (e) => {
            if (isTTSBusy) return; 
            e.stopPropagation();
            const parentElement = e.target.parentElement;
            let textToRead = parentElement.textContent.replace('🔊', '').trim();

            if (parentElement.tagName === 'H2' && parentElement.closest('.screen').id === 'menu-screen') {
                if (currentUser && currentUser.name) {
                    textToRead = `Main Menu. Welcome, ${currentUser.name}!`;
                }
            }
            textToSpeech(textToRead);
        });
    });

    document.getElementById('cancel-auth-btn').addEventListener('click', resetToHome);
    document.getElementById('balance-btn').addEventListener('click', () => {
        showReceipt("Balance Inquiry", "N/A", isDuressMode);
    });
    
    document.getElementById('withdraw-btn').addEventListener('click', () => {
        document.getElementById('withdraw-amount').value = '';
        showScreen('withdraw-screen');
    });
    
    document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', () => showScreen('menu-screen')));
    document.getElementById('exit-btn').addEventListener('click', resetToHome);

    const generateKeypad = () => {
        const keypadContainer = document.getElementById('keypad');
        const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'Clear', 0, 'Enter'];
        keys.forEach(key => {
            const keyBtn = document.createElement('button');
            keyBtn.classList.add('keypad-btn');
            keyBtn.textContent = key;
            keyBtn.addEventListener('click', () => {
                const pinDisplay = document.getElementById('pin-display');
                if (typeof key === 'number' && enteredPin.length < 4) {
                    enteredPin += key;
                } else if (key === 'Clear') {
                    enteredPin = '';
                } else if (key === 'Enter' && enteredPin.length === 4) {
                    checkLogin();
                }
                
                pinDisplay.textContent = '*'.repeat(enteredPin.length);
            });
            keypadContainer.appendChild(keyBtn);
        });
    };

    generateKeypad();
    showScreen('welcome-screen');
});
</script>
</body>
</html>
