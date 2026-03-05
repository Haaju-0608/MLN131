import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
    onAuthStateChanged,
    signInAnonymously,
    getAuth
} from 'firebase/auth';
import {
    ref,
    set,
    onValue,
    update,
    remove,
    get,
    push,
    onDisconnect
} from 'firebase/database';
import { database } from '../utils/FirebaseConfig';
import { getLevelByPoints, checkLevelUp } from '../utils/EvolutionLogic';

// Create context
const GameContext = createContext(null);

// Auth instance
const auth = getAuth();

// Provider component
export const GameProvider = ({ children }) => {
    // Auth state
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Game state
    const [roomCode, setRoomCode] = useState('');
    const [isHost, setIsHost] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [gameStatus, setGameStatus] = useState('LOBBY'); // LOBBY, QUIZ, RESULTS
    const [players, setPlayers] = useState({});
    const [currentQuestion, setCurrentQuestion] = useState(-1);
    const [questionStartTime, setQuestionStartTime] = useState(null);

    // Player data
    const [playerData, setPlayerData] = useState({
        name: '',
        pos: { x: 5, y: 5 },
        score: 0,
        level: 1,
        avatar: '👨‍🔧',
    });

    // Evolution notification
    const [evolutionNotification, setEvolutionNotification] = useState(null);

    // Initialize auth
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                // Sign in anonymously
                try {
                    const result = await signInAnonymously(auth);
                    setUser(result.user);
                } catch (error) {
                    console.error('Auth error:', error);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Subscribe to game state when room changes
    useEffect(() => {
        if (!roomCode) return;

        const hostRef = ref(database, `game/${roomCode}/hostId`);
        const hostUnsubscribe = onValue(hostRef, (snapshot) => {
            if (user && snapshot.val() === user.uid) {
                setIsHost(true); // Nếu mình là người tạo phòng, ép isHost thành true
            }
        });

        get(hostRef).then(snapshot => {
            if (user && snapshot.val() === user.uid) setIsHost(true);
        });

        // Subscribe to game status
        const statusRef = ref(database, `game/${roomCode}/status`);
        const statusUnsubscribe = onValue(statusRef, (snapshot) => {
            setGameStatus(snapshot.val() || 'LOBBY');
        });

        // Subscribe to current question
        const questionRef = ref(database, `game/${roomCode}/currentQuestion`);
        const questionUnsubscribe = onValue(questionRef, (snapshot) => {
            setCurrentQuestion(snapshot.val() ?? -1);
        });

        // Subscribe to question start time
        const startTimeRef = ref(database, `game/${roomCode}/questionStartTime`);
        const startTimeUnsubscribe = onValue(startTimeRef, (snapshot) => {
            setQuestionStartTime(snapshot.val());
        });

        // Subscribe to players
        const playersRef = ref(database, `game/${roomCode}/players`);
        const playersUnsubscribe = onValue(playersRef, (snapshot) => {
            setPlayers(snapshot.val() || {});
        });

        return () => {
            statusUnsubscribe();
            hostUnsubscribe();
            questionUnsubscribe();
            startTimeUnsubscribe();
            playersUnsubscribe();
        };
    }, [roomCode]);

    // Subscribe to current player data
    const lastNotifiedScoreRef = useRef(0);
    const [isMuted, setIsMuted] = useState(false);
    const bgmRef = useRef(new Audio('/assets/sounds/GO.mp3'));

    useEffect(() => {
        const bgm = bgmRef.current;
        bgm.loop = true;

        // Cập nhật âm lượng dựa trên trạng thái isMuted
        bgm.volume = isMuted ? 0 : 0.2;

        // Cố gắng phát nhạc ngay khi vào trang
        const playAttempt = () => {
            bgm.play().catch(() => {
                console.log("Trình duyệt chặn tự động phát. Chờ tương tác...");
            });
        };

        playAttempt();

        return () => bgm.pause();
    }, [isMuted]);

    const playMusic = useCallback(() => {
        bgmRef.current.play().catch(err => {
            console.log("Cần click để phát nhạc");
        });
    }, []);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    // 2. Sửa lại useEffect theo dõi player data
    useEffect(() => {
        if (!roomCode || !user?.uid) return;

        const playerRef = ref(database, `game/${roomCode}/players/${user.uid}`);
        const unsubscribe = onValue(playerRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Lấy điểm số cũ từ Ref thay vì từ state
                const oldScore = lastNotifiedScoreRef.current;
                const newScore = data.score || 0;
                const pointsGained = newScore - oldScore;

                setPlayerData(data);

                // CHỈ kiểm tra tiến hóa nếu điểm số thực sự THAY ĐỔI
                if (newScore !== oldScore) {
                    const result = checkLevelUp(oldScore, newScore);

                    if (result.leveledUp) {
                        setEvolutionNotification({
                            oldLevel: result.oldLevel,
                            newLevel: result.newLevel,
                            addedPoints: pointsGained,
                            timestamp: Date.now(),
                        });

                        // Sau khi hiện thông báo, cập nhật Ref ngay lập tức 
                        // để lần trả lời sau nó so sánh với điểm mới này
                        lastNotifiedScoreRef.current = newScore;

                        // Tự động ẩn sau 5 giây
                        setTimeout(() => {
                            setEvolutionNotification(null);
                        }, 5000);
                    } else {
                        // Nếu điểm thay đổi nhưng không lên cấp, 
                        // vẫn phải cập nhật Ref để đồng bộ điểm
                        lastNotifiedScoreRef.current = newScore;
                    }
                }
            }
        });

        return () => unsubscribe();
    }, [roomCode, user?.uid]);

    // Create a new room
    const createRoom = useCallback(async (code, name) => {
        if (!user?.uid) return false;

        const roomRef = ref(database, `game/${code}`);
        await set(roomRef, {
            status: 'LOBBY',
            hostId: user.uid,
            hostName: name,
            createdAt: Date.now(),
            currentQuestion: -1,
            questionStartTime: null,
        });

        // Add host as a player
        const playerRef = ref(database, `game/${code}/players/${user.uid}`);
        await set(playerRef, {
            name,
            pos: { x: 5, y: 5 },
            score: 0,
            level: 1,
            avatar: '👨‍🔧',
            joinedAt: Date.now(),
            isHost: true,
        });

        // Set up disconnect cleanup
        onDisconnect(playerRef).remove();

        setRoomCode(code);
        setIsHost(true);
        setPlayerName(name);
        setPlayerData({
            name,
            pos: { x: 5, y: 5 },
            score: 0,
            level: 1,
            avatar: '👨‍🔧',
        });

        return true;
    }, [user]);

    // Join an existing room
    const joinRoom = useCallback(async (code, name) => {
        if (!user?.uid) return false;

        // Check if room exists
        const roomRef = ref(database, `game/${code}/status`);
        const snapshot = await get(roomRef);

        if (!snapshot.exists()) {
            return false; // Room doesn't exist
        }

        // Add player
        const playerRef = ref(database, `game/${code}/players/${user.uid}`);
        await set(playerRef, {
            name,
            pos: { x: Math.floor(Math.random() * 10), y: Math.floor(Math.random() * 10) },
            score: 0,
            level: 1,
            avatar: '👨‍🔧',
            joinedAt: Date.now(),
            isHost: false,
        });

        // Set up disconnect cleanup
        onDisconnect(playerRef).remove();

        setRoomCode(code);
        setIsHost(false);
        setPlayerName(name);
        setPlayerData({
            name,
            pos: { x: 5, y: 5 },
            score: 0,
            level: 1,
            avatar: '👨‍🔧',
        });

        return true;
    }, [user]);

    // Update player position
    const updatePosition = useCallback(async (x, y) => {
        if (!roomCode || !user?.uid) return;

        const posRef = ref(database, `game/${roomCode}/players/${user.uid}/pos`);
        await set(posRef, { x, y });
    }, [roomCode, user]);

    // Leave room
    const leaveRoom = useCallback(async () => {
        if (!roomCode || !user?.uid) return;

        const playerRef = ref(database, `game/${roomCode}/players/${user.uid}`);
        await remove(playerRef);

        setRoomCode('');
        setIsHost(false);
        setGameStatus('LOBBY');
        setPlayers({});
        setCurrentQuestion(-1);
        setPlayerData({
            name: '',
            pos: { x: 5, y: 5 },
            score: 0,
            level: 1,
            avatar: '👨‍🔧',
        });
    }, [roomCode, user]);

    // Start quiz (host only)
    // Start quiz (host only)
    const startQuiz = useCallback(async () => {
        if (!isHost || !roomCode) return;

        bgmRef.current.play().catch(e => console.error("Nhạc vẫn bị chặn:", e));

        const roomRef = ref(database, `game/${roomCode}`);
        // Cập nhật nhiều giá trị cùng lúc: Status, Câu hỏi số 0, và Thời gian bắt đầu
        await update(roomRef, {
            status: 'QUIZ',
            currentQuestion: 0,
            questionStartTime: Date.now(),
            answers: null // Xóa đáp án cũ ván trước
        });
    }, [isHost, roomCode]);

    // End quiz / Show results (host only)
    const endQuiz = useCallback(async () => {
        if (!isHost || !roomCode) return;

        const statusRef = ref(database, `game/${roomCode}/status`);
        await set(statusRef, 'RESULTS');
    }, [isHost, roomCode]);

    // Return to lobby (host only)
    const returnToLobby = useCallback(async () => {
        if (!isHost || !roomCode) return;

        // 1. Chuyển trạng thái game về LOBBY
        const statusRef = ref(database, `game/${roomCode}/status`);
        await set(statusRef, 'LOBBY');

        const questionRef = ref(database, `game/${roomCode}/currentQuestion`);
        await set(questionRef, -1);

        // 2. Lấy danh sách tất cả người chơi để reset
        const playersRef = ref(database, `game/${roomCode}/players`);
        const playersSnapshot = await get(playersRef);
        const playersData = playersSnapshot.val();

        if (playersData) {
            // Tạo một đối tượng update để cập nhật nhiều đường dẫn cùng lúc (hiệu quả hơn)
            const updates = {};

            Object.keys(playersData).forEach((uid) => {
                // Reset vị trí ngẫu nhiên
                updates[`game/${roomCode}/players/${uid}/pos`] = {
                    x: Math.floor(Math.random() * 15),
                    y: Math.floor(Math.random() * 10)
                };

                // --- THÊM LOGIC RESET ĐIỂM Ở ĐÂY ---
                updates[`game/${roomCode}/players/${uid}/score`] = 0;
                updates[`game/${roomCode}/players/${uid}/level`] = 1;
                updates[`game/${roomCode}/players/${uid}/avatar`] = '👨‍🔧';
            });

            // 3. Thực hiện cập nhật lên Firebase
            await update(ref(database), updates);
        }

        // 4. Reset luôn điểm lưu trong Ref cục bộ của Host để tránh hiện Evolution sai khi chơi ván mới
        lastNotifiedScoreRef.current = 0;

    }, [isHost, roomCode]);

    // Submit answer
    const submitAnswer = useCallback(async (questionId, answerIndex, timeRemaining) => {
        if (!roomCode || !user?.uid) return;

        // QUAN TRỌNG: Lưu vào đúng đường dẫn mà Host sẽ đọc
        const answerRef = ref(database, `game/${roomCode}/answers/${user.uid}/${questionId}`);

        await set(answerRef, {
            // Ép kiểu số để Host so sánh không bị lệch
            answerIndex: Number(answerIndex),
            timeRemaining: Number(timeRemaining),
            timestamp: Date.now(),
        });

        console.log(`Đã gửi đáp án câu ${questionId}: index ${answerIndex}`);
    }, [roomCode, user]);

    // Update player score (called after quiz ends)
    const updateScore = useCallback(async (uid, additionalScore) => {
        if (!roomCode) return;

        const playerRef = ref(database, `game/${roomCode}/players/${uid}`);
        const snapshot = await get(playerRef);

        if (snapshot.exists()) {
            const currentData = snapshot.val();
            const newScore = (currentData.score || 0) + additionalScore;
            const newLevel = getLevelByPoints(newScore);

            await update(playerRef, {
                score: newScore,
                level: newLevel.id,
                avatar: newLevel.avatar,
            });
        }
    }, [roomCode]);

    // Clear evolution notification
    const clearEvolutionNotification = useCallback(() => {
        setEvolutionNotification(null);
    }, []);

    // Value object
    const value = {
        // Auth
        user,
        loading,

        // Game state
        roomCode,
        isHost,
        playerName,
        gameStatus,
        players,
        currentQuestion,
        questionStartTime,
        playerData,
        evolutionNotification,
        isMuted,

        // Actions
        createRoom,
        joinRoom,
        leaveRoom,
        updatePosition,
        startQuiz,
        endQuiz,
        returnToLobby,
        submitAnswer,
        updateScore,
        clearEvolutionNotification,
        setRoomCode,
        toggleMute,
        playMusic: () => bgmRef.current.play().catch(() => { })
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
};

// Custom hook to use game context
export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};


export default GameContext;

