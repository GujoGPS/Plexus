```markdown
# Plexus (WorkspaceHub) 🌌🧠

**Plexus** is an intelligent personal productivity ecosystem designed as an "external brain" to help neurodivergent individuals (ASD/ADHD) manage cognitive load with efficiency, focus, and zero friction.

## 🚀 Overview

Unlike generic productivity tools, Plexus was built to respect the neurodivergent brain. It integrates **Google Workspace** (Calendar, Drive, Notes, and Tasks) into a unified, minimalist, and highly visual interface.

### ✨ Key Features for ASD/ADHD

* **Zen Mode (Hyperfocus):** A clean interface that eliminates visual distractions for deep focus on writing or planning.
* **Energy Management (Batteries 🔋):** Categorize tasks by mental energy cost (1 to 5), helping to prevent burnout by visualizing daily capacity.
* **Floating Pomodoro:** A persistent, draggable timer with "Ghost Mode" (transparency) and size scaling to help overcome task inertia without causing sensory overload.
* **Galaxy View (Spatial System):** An intuitive visual navigation system where your notes float in a constellation, making spatial organization and retrieval effortless.
* **Accessibility First:** Full support for handwriting (S-Pen) with pressure sensitivity and organizational shortcuts designed to reduce choice paralysis.

## 🛠️ Tech Stack

* **Frontend:** React 18 + TypeScript + Vite
* **UI/UX:** Material UI (MUI) v5 + Framer Motion
* **State Management:** Zustand (Atomic persistence)
* **Cloud & Auth:** Google Identity Services + Google Calendar API
* **Persistence:** Google Drive API (Private storage via `appDataFolder`)
* **Artificial Intelligence:** Gemini 1.5 Flash (for summarization, task extraction, and note refinement)

## 📦 Getting Started

### 1. Prerequisites
* Node.js (Latest LTS)
* A **Google Cloud Console** account with an OAuth 2.0 Client ID configured
* A **Google AI Studio** (Gemini) API Key

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone [https://github.com/GujoGPS/Plexus.git](https://github.com/GujoGPS/Plexus.git)
cd Plexus
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory with your credentials:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 4. Running the App
```bash
npm run dev
```

## 🔒 Privacy & Security

Plexus is secure by design. Your data (notes, tasks, and history) is saved and encrypted exclusively within a hidden folder in **your own Google Drive**. No third-party servers ever store your personal information, and the developers have zero access to your content.

## 📄 License

This project is for personal use and cognitive accessibility purposes. All rights reserved.
```