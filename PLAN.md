# The Great Escape: Worker 4.0 Evolution - Project Plan

## 1. Project Overview

**Project Title:** The Great Escape: Worker 4.0 Evolution
**Type:** Multiplayer Educational Game (ZEP-style)
**Tech Stack:** ReactJS, Tailwind CSS, Firebase Realtime Database, Framer Motion
**Core Functionality:** A multiplayer quiz game where players evolve their avatars from manual workers to Knowledge Workers 4.0 based on quiz performance

---

## 2. File Structure

```
d:/Ki9-FPT/MLN131/Game/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── GameMap.jsx
│   │   ├── QuizComponent.jsx
│   │   ├── HostDashboard.jsx
│   │   ├── ClientUI.jsx
│   │   ├── Joystick.jsx
│   │   ├── Leaderboard.jsx
│   │   └── EvolutionNotification.jsx
│   ├── hooks/
│   │   ├── useGameState.js
│   │   └── usePlayerPosition.js
│   ├── utils/
│   │   ├── FirebaseConfig.js
│   │   └── EvolutionLogic.js
│   ├── context/
│   │   └── GameContext.jsx
│   ├── data/
│   │   └── quizQuestions.js
│   ├── App.js
│   ├── App.css
│   └── index.js
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── PLAN.md
```

---

## 3. Component Breakdown

### 3.1 FirebaseConfig.js
- Firebase configuration with initialization
- Export database reference
- Authentication (anonymous for players)

### 3.2 EvolutionLogic.js
- Level definitions:
  - Level 1 (0-2000 pts): Manual Worker 👨‍🔧
  - Level 2 (2001-5000 pts): Mechanical Worker 👷‍♂️
  - Level 3 (>5000 pts): Knowledge Worker 4.0 🤖👨‍💻
- Point-to-level mapping function
- Background image mapping per level

### 3.3 GameContext.jsx
- Global game state management
- Player data, room info, game status
- Firebase listeners for real-time updates

### 3.4 App.js
- Router for Host/Client routes
- Room joining mechanism
- Main game layout

### 3.5 GameMap.jsx
- 2D Grid system (20x15 cells)
- Player movement (WASD/Arrow keys)
- Real-time position sync via Firebase
- Avatar rendering with evolution sprites
- Background changes based on evolution level

### 3.6 QuizComponent.jsx
- Full-screen quiz overlay
- Timer with speed-based scoring
- Formula: Points = (RemainingTime / TotalTime) * 1000
- Multiple choice questions display

### 3.7 HostDashboard.jsx
- Large map view
- "Start Game" button
- Leaderboard display
- Correct answer reveal
- Room code display

### 3.8 ClientUI.jsx
- Virtual joystick for mobile
- Keyboard controls for PC
- Quiz interface
- Evolution notification with framer-motion glow

### 3.9 Joystick.jsx
- Touch-based virtual joystick
- Direction detection for mobile movement

### 3.10 Leaderboard.jsx
- Sorted player rankings
- Score display with evolution level

### 3.11 EvolutionNotification.jsx
- Framer-motion animation
- Glow effect on level up

---

## 4. Firebase Data Structure

```
/game/{roomCode}/
  ├── status: "LOBBY" | "QUIZ" | "RESULTS"
  ├── currentQuestion: number
  ├── questionStartTime: timestamp
  ├── hostId: string
  └── players/
     /{uid}/
          ├── name: string
          ├── pos: {x: number, y: number}
          ├── score: number
          ├── level: number
          └── avatar: string

/questions/
  └── {questionId}/
        ├── question: string
        ├── options: string[4]
        ├── correctIndex: number
        └── chapter: string
```

---

## 5. Implementation Steps

### Step 1: Initialize Project
- Create React app with Vite
- Install dependencies: firebase, framer-motion, tailwindcss, react-joystick-component

### Step 2: Configure Firebase
- Create FirebaseConfig.js with project credentials
- Set up database structure

### Step 3: Core Components
- Create GameContext for state management
- Implement GameMap with grid and movement

### Step 4: Quiz System
- Build QuizComponent with timer
- Implement scoring logic

### Step 5: Evolution System
- Create EvolutionLogic utility
- Add framer-motion glow effects

### Step 6: Host & Client Views
- Build HostDashboard with controls
- Build ClientUI with joystick

### Step 7: Testing & Refinement
- Test real-time sync
- Verify evolution triggers correctly

---

## 6. Quiz Questions (Chapter 2: Historical Mission of Working Class)

10 sample questions focusing on:
- Industrial Revolution
- Worker movements
- Labor rights
- Evolution of work

---

## 7. Visual Design

### Colors
- Primary: #3B82F6 (Blue)
- Secondary: #10B981 (Green)
- Accent: #F59E0B (Amber)
- Background Levels:
  - Level 1: #1F2937 (Dark Factory)
  - Level 2: #374151 (Assembly Line)
  - Level 3: #1E3A8A (High-tech Lab)

### Sprites
- Level 1: 👨‍🔧 Manual Worker
- Level 2: 👷‍♂️ Mechanical Worker  
- Level 3: 🤖👨‍💻 Knowledge Worker 4.0

---

## 8. Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "firebase": "^10.0.0",
    "framer-motion": "^10.0.0",
    "react-router-dom": "^6.0.0",
    "react-joystick-component": "^6.0.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
```

