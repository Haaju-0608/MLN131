import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import GameMap from './GameMap';
import { quizQuestions } from '../data/quizQuestions';
import { ref, set, get, update } from 'firebase/database';
import { calculateQuizScore, getLevelByPoints } from '../utils/EvolutionLogic';
import { database } from '../utils/FirebaseConfig';
import { QRCodeSVG } from 'qrcode.react';

const HostDashboard = () => {
    const {
        roomCode,
        isHost,
        gameStatus,
        players,
        startQuiz,
        endQuiz,
        returnToLobby,
        currentQuestion,
        playerName,
    } = useGame();

    const [questionIndex, setQuestionIndex] = useState(0);
    const [isStarting, setIsStarting] = useState(false);
    const mapRef = useRef(null);

    useEffect(() => {
        if (currentQuestion !== undefined && currentQuestion !== null) {
            setQuestionIndex(currentQuestion);
        }
    }, [currentQuestion]);

    // Get sorted players for leaderboard
    const sortedPlayers = Object.entries(players)
        .map(([uid, player]) => ({ uid, ...player }))
        .sort((a, b) => (b.score || 0) - (a.score || 0));

    // Handle start quiz
    const handleStartQuiz = async () => {
        if (!isHost || sortedPlayers.length === 0) return;

        setIsStarting(true);

        await set(ref(database, `game/${roomCode}/answers`), null);

        // Set current question
        const questionRef = ref(database, `game/${roomCode}/currentQuestion`);
        await set(questionRef, 0);
        setQuestionIndex(0);

        // Set question start time
        const startTimeRef = ref(database, `game/${roomCode}/questionStartTime`);
        await set(startTimeRef, Date.now());

        // Start quiz
        await startQuiz();
        setIsStarting(false);
    };

    // Handle end quiz / show results
    const handleShowResults = async () => {
        try {
            // 1. Chuyển trạng thái sang RESULTS để dừng mọi máy khách
            await set(ref(database, `game/${roomCode}/status`), 'RESULTS');
            console.log(">>> HOST SHOW RESULTS - BẮT ĐẦU QUÉT ĐIỂM");

            // 2. Lấy dữ liệu câu hỏi và đáp án trực tiếp từ Firebase (chống lag state)
            const gameSnap = await get(ref(database, `game/${roomCode}`));
            const gameData = gameSnap.val();

            if (!gameData || !gameData.answers) {
                console.log("Không có ai nộp đáp án.");
                return;
            }

            const activeIdx = gameData.currentQuestion;
            const correctIdx = Number(quizQuestions[activeIdx]?.correctIndex);
            const updates = {};

            // 3. Duyệt danh sách đáp án
            Object.entries(gameData.answers).forEach(([uid, userAnswers]) => {
                const answer = userAnswers[activeIdx];
                if (answer && Number(answer.answerIndex) === correctIdx) {
                    // Tính điểm dựa trên thời gian còn lại
                    const timeBonus = Number(answer.timeRemaining || 0);
                    let points = calculateQuizScore(timeBonus, 30); // 30 là QUESTION_TIME
                    if (points <= 0) points = 100;

                    const oldScore = Number(gameData.players[uid]?.score || 0);
                    const newScore = oldScore + points;
                    const levelData = getLevelByPoints(newScore);

                    updates[`game/${roomCode}/players/${uid}/score`] = newScore;
                    updates[`game/${roomCode}/players/${uid}/level`] = levelData.id;
                    updates[`game/${roomCode}/players/${uid}/avatar`] = levelData.avatar;
                    console.log(`✅ Tính điểm cho ${uid}: +${points}`);
                }
            });

            // 4. Đẩy tất cả điểm số lên một lần duy nhất
            if (Object.keys(updates).length > 0) {
                await update(ref(database), updates);
                console.log(">>> ĐÃ CẬP NHẬT ĐIỂM THÀNH CÔNG");
            }

        } catch (error) {
            console.error("Lỗi khi tính điểm tại HostDashboard:", error);
        }
    };

    // Handle return to lobby
    const handleReturnToLobby = async () => {
        await returnToLobby();
        setQuestionIndex(0);
    };

    // Get next question - Update both currentQuestion AND set gameStatus to QUIZ
    const handleNextQuestion = async () => {
        // 1. Kiểm tra xem còn câu hỏi không
        const isLastQuestion = questionIndex >= quizQuestions.length - 1;

        if (!isLastQuestion) {
            // NHÁNH: CÒN CÂU HỎI -> CHUYỂN CÂU TIẾP THEO
            const nextIndex = questionIndex + 1;

            // Cập nhật Local State trước để giao diện Host thay đổi ngay
            setQuestionIndex(nextIndex);

            // Cập nhật lên Firebase
            const updates = {};
            updates[`game/${roomCode}/currentQuestion`] = nextIndex;
            updates[`game/${roomCode}/questionStartTime`] = Date.now();
            updates[`game/${roomCode}/status`] = 'QUIZ'; // Đưa mọi người quay lại màn hình câu hỏi
            updates[`game/${roomCode}/answers`] = null; // reset answers

            await update(ref(database), updates);
            console.log(">>> Đã chuyển sang câu:", nextIndex + 1);
        } else {
            // NHÁNH: HẾT CÂU HỎI -> KẾT THÚC GAME
            console.log(">>> Đang kết thúc game...");
            await set(ref(database, `game/${roomCode}/status`), 'FINAL_RESULTS');
        }
    };

    if (!isHost) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="text-white text-xl">Access denied. Only the host can view this page.</div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-900 flex flex-col">
            {/* Header */}
            <div className="bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-white">🎮 Host Dashboard</h1>
                    <span className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        HOST
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-gray-400">
                        Room: <span className="text-yellow-400 font-bold text-lg">{roomCode}</span>
                    </div>
                    <div className="text-gray-400">
                        Players: <span className="text-white font-bold">{sortedPlayers.length}</span>
                    </div>
                </div>
            </div>

            {/* QR Code Section - Show when in lobby */}
            {gameStatus === 'LOBBY' && (
                <div className="bg-gray-800 p-4 border-b border-gray-700">
                    <div className="flex items-center justify-center gap-8">
                        <div className="text-center">
                            <p className="text-gray-400 text-sm mb-2">Scan to Join</p>
                            <div className="bg-white p-2 rounded-lg inline-block">
                                <QRCodeSVG
                                    /* Khớp với Route /game/:roomCode trong App.js */
                                    value={`https://zincographic-kris-clinically.ngrok-free.dev/game/${roomCode}`}
                                    size={180}
                                    level={"H"}
                                />
                            </div>
                            <p className="text-white mt-2 font-mono text-xl">{roomCode}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Game Map - Larger for Host */}
                <div className="flex-1 p-4 flex items-center justify-center bg-gray-950">
                    <div ref={mapRef}>
                        <GameMap isHost={true} />
                    </div>
                </div>

                {/* Control Panel */}
                <div className="w-80 bg-gray-800 p-4 border-l border-gray-700 overflow-y-auto">
                    {/* Game Status */}
                    <div className="mb-6">
                        <h3 className="text-white font-bold mb-2">Game Status</h3>
                        <div className={`
              px-4 py-2 rounded-lg text-center font-bold
              ${gameStatus === 'LOBBY' ? 'bg-blue-600' : ''}
              ${gameStatus === 'QUIZ' ? 'bg-green-600 animate-pulse' : ''}
              ${gameStatus === 'RESULTS' ? 'bg-purple-600' : ''}
              text-white
            `}>
                            {gameStatus}
                        </div>
                    </div>

                    {/* Controls - Lobby */}
                    {gameStatus === 'LOBBY' && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-gray-400 text-sm">Select Question</label>
                                <select
                                    value={questionIndex}
                                    onChange={(e) => setQuestionIndex(Number(e.target.value))}
                                    className="w-full mt-1 p-2 bg-gray-700 text-white rounded-lg border border-gray-600"
                                >
                                    {quizQuestions.map((q, idx) => (
                                        <option key={q.id} value={idx}>
                                            Q{idx + 1}: {q.question.substring(0, 30)}...
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleStartQuiz}
                                disabled={sortedPlayers.length === 0 || isStarting}
                                className={`
                  w-full py-3 rounded-lg font-bold text-white
                  ${sortedPlayers.length === 0 || isStarting
                                        ? 'bg-gray-600 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-500'
                                    }
                `}
                            >
                                {isStarting ? 'Starting...' : '🚀 Start Round'}
                            </button>
                        </div>
                    )}

                    {/* Controls - Quiz */}
                    {gameStatus === 'QUIZ' && (
                        <div className="space-y-4">
                            <div className="bg-gray-700 rounded-lg p-4">
                                <h4 className="text-white font-bold mb-2">Current Question</h4>
                                <p className="text-gray-300 text-sm">
                                    {quizQuestions[questionIndex]?.question}
                                </p>
                                <div className="mt-2 text-xs text-gray-400">
                                    Answer: {String.fromCharCode(65 + quizQuestions[questionIndex]?.correctIndex)}
                                </div>
                            </div>

                            <button
                                onClick={handleShowResults}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold text-white"
                            >
                                📊 Show Results
                            </button>
                        </div>
                    )}

                    {/* Controls - Results */}
                    {gameStatus === 'RESULTS' && (
                        <div className="space-y-4">
                            <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-500">
                                <h4 className="text-purple-400 font-bold mb-2">🏆 Round Results</h4>
                                <p className="text-gray-300 text-sm">
                                    Question {questionIndex + 1} / {quizQuestions.length} complete!
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleNextQuestion}
                                    // BỎ disabled ở đây để hàm handleNextQuestion tự xử lý nhánh cuối
                                    className={`flex-1 py-4 rounded-lg font-bold text-white transition-all active:scale-95 shadow-lg ${questionIndex >= quizQuestions.length - 1
                                        ? 'bg-red-600 hover:bg-red-500'
                                        : 'bg-blue-600 hover:bg-blue-500'
                                        }`}
                                >
                                    {questionIndex >= quizQuestions.length - 1 ? '🏁 FINISH & SHOW WINNER' : '➡️ NEXT QUESTION'}
                                </button>
                            </div>

                            <button
                                onClick={handleReturnToLobby}
                                className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 text-sm transition-colors"
                            >
                                🏠 Emergency Return to Lobby
                            </button>
                        </div>
                    )}

                    {/* Players List */}
                    <div className="mt-6">
                        <h3 className="text-white font-bold mb-2">Players ({sortedPlayers.length})</h3>
                        <div className="space-y-2">
                            {sortedPlayers.map((player, idx) => (
                                <div
                                    key={player.uid}
                                    className="flex items-center justify-between bg-gray-700 rounded-lg p-2"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 text-sm">#{idx + 1}</span>
                                        <span>{player.avatar}</span>
                                        <span className="text-white text-sm">{player.name}</span>
                                        {player.isHost && (
                                            <span className="text-xs bg-yellow-600 px-1 rounded">H</span>
                                        )}
                                    </div>
                                    <span className="text-yellow-400 font-bold">{player.score || 0}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HostDashboard;

