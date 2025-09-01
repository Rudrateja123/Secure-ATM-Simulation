# 🤖 AI-Powered Secure ATM Simulation

A full-stack web application simulating a secure ATM, featuring a novel dynamic grid-based authentication system to prevent shoulder surfing and an AI-powered financial advisor.

**[Link to Live Demo]** <--- *(coming soon)*

---

## ✨ Key Features

- **Dynamic PIN Authentication:** Generates a unique, one-time PIN based on a user's secret color/position pattern, making it immune to shoulder-surfing.
- **Duress PIN System:** A secret PIN that simulates a successful transaction with a low balance to deceive attackers while silently flagging the account.
- **AI Financial Health Analysis:** Integrates with the Google Gemini API to provide users with an intelligent analysis of their spending habits and personalized savings plans.
- **Full-Stack Architecture:** Built with a separate client and a secure Node.js/Express.js backend API.
- **Persistent Data:** User data, balances, and transaction histories are stored in a MongoDB cloud database.

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas (NoSQL)
- **AI:** Google Gemini API

---

## ⚙️ Setup and Installation

Instructions for setting up the project locally:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/your-repository-name.git](https://github.com/your-username/your-repository-name.git)
    ```
2.  **Navigate to the server directory and install dependencies:**
    ```bash
    cd server
    npm install
    ```
3.  **Create a `.env` file** in the `server` directory and add your secret keys:
    ```
    MONGO_URI=your_mongodb_connection_string
    GEMINI_API_KEY=your_gemini_api_key
    ```
4.  **Start the server:**
    ```bash
    npm start
    ```
5.  Open `client/index.html` in your browser.
