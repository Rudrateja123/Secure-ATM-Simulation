

# 🤖 AI-Powered Secure ATM Simulation

A full-stack web application simulating a secure ATM, featuring a novel dynamic grid-based authentication system to prevent shoulder surfing and an AI-powered financial advisor.


---

## ✨ Key Features

- **Dynamic PIN Authentication:** Generates a unique, one-time PIN based on a user's secret color/position pattern, making it immune to shoulder-surfing.
- **Duress PIN System:** A secret PIN that simulates a successful transaction with a low balance to deceive attackers while silently flagging the account.
- **AI Financial Health Analysis:** Integrates with the Google Gemini API to provide users with an intelligent analysis of their spending habits and personalized savings plans.
- **Full-Stack Architecture:** Built with a separate client and a secure Node.js/Express.js backend API.
- **Persistent Data:** User data, balances, and transaction histories are stored in a MongoDB cloud database.

---
## 📸 Application Flow & Screenshots

Here is a visual walkthrough of the user experience, from registration to performing transactions.

**1. Welcome & Entry**
The user is greeted with a clean interface where they can enter their name to either log in or begin the registration process.

![Welcome Screen](/Results/entry.png)

**2. New Card Setup - Step 1: Pattern Selection**
New users are guided to select their secret 4-position pattern on the dynamic grid. This pattern is the foundation of their security.

![Pattern Setup](/Results/setup.png)

**3. New Card Setup - Step 2: Duress PIN**
As an advanced security measure, the user sets a separate 4-digit Duress PIN.

![Duress PIN Setup](/Results/duressPIN.png)

**4. Registration Success**
Upon completion, the system displays the user's chosen pattern and Duress PIN for final verification.

![Setup Confirmation](/Results/setupSuccessful.png)

**5. Secure Login**
For each login attempt, the numbers on the grid are randomized. The user enters their one-time PIN based on the numbers now appearing in their secret positions, making it secure against observation.

![Login Screen](/Results/login.png)

**6. Main Menu**
After successful authentication, the user has access to all standard ATM functions.

![Main Menu](/Results/mainMenu.png)

**7. Transactions & AI Features**
Users can perform transactions like checking their balance or use the integrated AI to get personalized financial advice and savings plans.

![Balance Inquiry](/Results/balanceEnquiry.png)
![AI Finance Plan](/Results/AI%20Finance%20Plan.png)

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas (NoSQL)
- **AI:** Google Gemini API

---

## ⚙️ Setup and Installation

Follow these steps to get the project running on your local machine.

### 1. Clone the Repository
First, clone this project from GitHub to your computer.
```bash
git clone https://github.com/Rudrateja123/Secure-ATM-Simulation.git
cd your-repository-name
````

### 2\. Set Up the Backend Server

The server handles all the application logic and database communication.

**a. Install Dependencies:**
Navigate into the `server` directory and install the required npm packages.

```bash
cd server
npm install
```

**b. Create Your Environment File (`.env`):**
Create a new file named `.env` inside the `server` directory. This is where you will store your secret keys. Copy and paste the following content into it:

```
PORT=5000
MONGODB_URI="your_mongodb_connection_string"
GEMINI_API_KEY="your_gemini_api_key"
```

**c. Get Your MongoDB Connection URI:**
We will use MongoDB Atlas, which offers a free cloud database.

1.  Go to **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas)** and create a free account.
2.  Create a new project and build a **Free Tier (M0) Cluster**.
3.  **Create a Database User:** Under "Database Access," create a new user with a username and a strong password. Grant this user "Read and write to any database" privileges. **Save this password\!**
4.  **Whitelist Your IP Address:** Under "Network Access," click "Add IP Address" and select **"Allow Access From Anywhere"** (`0.0.0.0/0`).
5.  **Get the Connection String:** Go back to your database cluster, click **"Connect"**, select **"Drivers"**, and copy the connection string provided.
6.  Paste this string into the `MONGODB_URI` field in your `.env` file. Be sure to replace `<password>` with the password you created in step 3 and add a database name (e.g., `secure-atm-db`) before the `?`.

**d. Get Your Gemini API Key:**

1.  Go to **[Google AI Studio](https://aistudio.google.com/app/apikey)**.
2.  Click **"Create API key in new project"**.
3.  Copy the generated API key.
4.  Paste this key into the `GEMINI_API_KEY` field in your `.env` file.

**e. Start the Server:**
Once your `.env` file is complete, you can start the server.

```bash
npm start
```

The terminal should show `Server is running on http://localhost:5000` and `MongoDB connected successfully.` **Leave this terminal running.**

### 3\. Run the Frontend Client

1.  If you are using Visual Studio Code, install the **"Live Server"** extension.
2.  Navigate to the `client` folder.
3.  Right-click on the `index.html` file and select **"Open with Live Server"**.

Your ATM application should now open in your browser and be fully functional\!
---

## 📄 License

This project is licensed under the MIT License.
