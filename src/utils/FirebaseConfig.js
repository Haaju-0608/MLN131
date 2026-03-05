// Firebase Configuration
// Replace these values with your Firebase project credentials

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push, onValue, update, remove, get, onDisconnect } from 'firebase/database';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// Firebase configuration - Replace with your own config
const firebaseConfig = {
    apiKey: "AIzaSyD79LozBFu51xDnI5fXFXb8MmQ2vPfcXkg",
    authDomain: "nhomcongnhan40.firebaseapp.com",
    databaseURL: "https://nhomcongnhan40-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "nhomcongnhan40",
    storageBucket: "nhomcongnhan40.firebasestorage.app",
    messagingSenderId: "692824830085",
    appId: "1:692824830085:web:fea9a8a4051bdf8d7079ec"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Database References
const dbRefs = {
    // Root reference
    root: ref(database),

    // Game room reference
    game: (roomCode) => ref(database, `game/${roomCode}`),

    // Players in a room
    players: (roomCode) => ref(database, `game/${roomCode}/players`),
    player: (roomCode, uid) => ref(database, `game/${roomCode}/players/${uid}`),
    playerPos: (roomCode, uid) => ref(database, `game/${roomCode}/players/${uid}/pos`),
    playerScore: (roomCode, uid) => ref(database, `game/${roomCode}/players/${uid}/score`),
    playerLevel: (roomCode, uid) => ref(database, `game/${roomCode}/players/${uid}/level`),

    // Game state
    gameStatus: (roomCode) => ref(database, `game/${roomCode}/status`),
    currentQuestion: (roomCode) => ref(database, `game/${roomCode}/currentQuestion`),
    questionStartTime: (roomCode) => ref(database, `game/${roomCode}/questionStartTime`),

    // Questions
    questions: () => ref(database, 'questions'),

    // Leaderboard
    leaderboard: (roomCode) => ref(database, `game/${roomCode}/leaderboard`),
};

// Helper Functions

// Sign in anonymously
export const signInAnon = () => {
    return signInAnonymously(auth);
};

// Get current user
export const getCurrentUser = () => {
    return auth.currentUser;
};

// Auth state listener
export const onAuthChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};

// Create or join a game room
export const createRoom = async (roomCode, hostId, hostName) => {
    const roomRef = dbRefs.game(roomCode);
    await set(roomRef, {
        status: 'LOBBY',
        hostId,
        hostName,
        createdAt: Date.now(),
        currentQuestion: -1,
    });
    return roomRef;
};

// Join an existing room
export const joinRoom = async (roomCode, uid, playerName) => {
    const playerRef = dbRefs.player(roomCode, uid);
    await set(playerRef, {
        name: playerName,
        pos: { x: 5, y: 5 },
        score: 0,
        level: 1,
        avatar: '👨‍🔧',
        joinedAt: Date.now(),
    });

    // Set up disconnect cleanup
    onDisconnect(playerRef).remove();

    return playerRef;
};

// Update player position
export const updatePlayerPos = async (roomCode, uid, x, y) => {
    const posRef = dbRefs.playerPos(roomCode, uid);
    await set(posRef, { x, y });
};

// Update player score
export const updatePlayerScore = async (roomCode, uid, score) => {
    const scoreRef = dbRefs.playerScore(roomCode, uid);
    await set(scoreRef, score);
};

// Update player level
export const updatePlayerLevel = async (roomCode, uid, level, avatar) => {
    const levelRef = dbRefs.playerLevel(roomCode, uid);
    await set(levelRef, { level, avatar });
};

// Start quiz mode
export const startQuiz = async (roomCode) => {
    const statusRef = dbRefs.gameStatus(roomCode);
    await set(statusRef, 'QUIZ');
};

// End quiz mode
export const endQuiz = async (roomCode) => {
    const statusRef = dbRefs.gameStatus(roomCode);
    await set(statusRef, 'RESULTS');
};

// Return to lobby
export const returnToLobby = async (roomCode) => {
    const statusRef = dbRefs.gameStatus(roomCode);
    await set(statusRef, 'LOBBY');
};

// Subscribe to game state
export const subscribeToGame = (roomCode, callback) => {
    const roomRef = dbRefs.game(roomCode);
    return onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        callback(data);
    });
};

// Subscribe to players
export const subscribeToPlayers = (roomCode, callback) => {
    const playersRef = dbRefs.players(roomCode);
    return onValue(playersRef, (snapshot) => {
        const data = snapshot.val();
        callback(data || {});
    });
};

// Subscribe to specific player
export const subscribeToPlayer = (roomCode, uid, callback) => {
    const playerRef = dbRefs.player(roomCode, uid);
    return onValue(playerRef, (snapshot) => {
        const data = snapshot.val();
        callback(data);
    });
};

// Leave room
export const leaveRoom = async (roomCode, uid) => {
    const playerRef = dbRefs.player(roomCode, uid);
    await remove(playerRef);
};

// Get all questions
export const getQuestions = async () => {
    const questionsRef = dbRefs.questions();
    const snapshot = await get(questionsRef);
    return snapshot.val() || [];
};

export { database, ref, onValue, set, update, remove, get, push };
export default app;

