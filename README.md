# Ledgerly - Personal Finance Tracker 🪙🎮

**Ledgerly** is an arcade-themed, gamified personal finance tracker built to make budgeting, expense logging, and wealth tracking engaging, intuitive, and fun.

---

## ✨ Features

- **🎮 Gamified Financial Dashboard**: Retro arcade visual aesthetics, level-up milestones, and audio feedback for logging transactions and reaching goals.
- **🔐 Multi-Method Authentication**: Full support for Email/Password sign-up/login, Google Sign-In, and instant Password Reset flows via Firebase Auth.
- **⚡ Real-Time Cloud Synchronization**: Instant sync across devices powered by Google Firebase Firestore with smart offline caching.
- **💰 Multi-Account & Ledger Management**: Track checking, savings, investment accounts, and credit cards with automated balance updates.
- **📊 Interactive Analytics & Charts**: Expense breakdowns by category, budget progress bars, and spending trends.
- **🎯 Financial Goals & Achievements**: Set target savings goals with interactive progress tracking and celebratory rewards.
- **🔔 Notifications & History**: Real-time notifications for budget alerts, milestone completions, and transactional records.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Animations & Icons**: Motion (Framer Motion), Lucide React
- **Audio**: Web Audio API (Retro arcade sound synthesizer)
- **Backend & Auth**: Firebase Authentication & Google Cloud Firestore

---

## 🚀 Getting Started Locally

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18 or higher) installed on your machine.

### Installation

1. **Clone or Download the Repository**:
   ```bash
   git clone <repository-url>
   cd cash-quest
Install Dependencies:
code
Bash
npm install
Environment Setup:
Create a .env file in the root directory (or use .env.example) and supply your Firebase configuration keys:
code
Env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
Start the Development Server:
code
Bash
npm run dev
Open your browser and navigate to http://localhost:3000.
🌐 Deploying to Production
Firebase Hosting (Recommended)
Build the production bundle:
code
Bash
npm run build
Deploy using the Firebase CLI:
code
Bash
npx firebase-tools login
npx firebase-tools init hosting
npx firebase-tools deploy --only hosting
