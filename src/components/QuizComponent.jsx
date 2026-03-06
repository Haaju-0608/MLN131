import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { quizQuestions } from '../data/quizQuestions';
import { calculateQuizScore, getLevelByPoints } from '../utils/EvolutionLogic';
import { ref, get, update } from 'firebase/database';
import { database } from '../utils/FirebaseConfig';

const QUESTION_TIME = 10;

const QuizComponent = ({ onRoundEnd }) => {
    const {
        roomCode,
        isHost,
        currentQuestion,
        questionStartTime,
        gameStatus,
        submitAnswer,
    } = useGame();

    const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const timerRef = useRef(null);

    // BẢO VỆ 1: Ép kiểu Number và đảm bảo index không bị undefined/null
    const currentIndex = Number(currentQuestion) || 0;
    const question = quizQuestions[currentIndex] || null;

    // Reset trạng thái khi đổi câu hỏi
    useEffect(() => {
        setSelectedAnswer(null);
        setHasAnswered(false);
        setShowResult(false);
        setTimeLeft(QUESTION_TIME);
        if (timerRef.current) clearInterval(timerRef.current);
    }, [currentIndex]); // Theo dõi currentIndex thay vì currentQuestion gốc

    // Xử lý Timer
    useEffect(() => {
        if (gameStatus !== 'QUIZ' || !questionStartTime || showResult) return;

        const updateTimer = () => {
            const elapsed = Math.floor((Date.now() - questionStartTime) / 1000);
            const remaining = Math.max(0, QUESTION_TIME - elapsed);
            setTimeLeft(remaining);

            if (remaining <= 0) {
                handleTimeUp();
            }
        };

        updateTimer();
        timerRef.current = setInterval(updateTimer, 1000);
        return () => clearInterval(timerRef.current);
    }, [gameStatus, questionStartTime, currentIndex, showResult]);

    const handleTimeUp = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setShowResult(true);

        // QUAN TRỌNG: Chỉ Host mới có quyền tính điểm
        if (isHost) {
            console.log("Host đang đợi 3 giây để nhận đủ đáp án từ mọi người...");
            // Đợi 3-4 giây để đảm bảo mọi máy khách đã submitAnswer xong
            setTimeout(() => {
                calculateAndUpdateScores();
            }, 2000);
        }
    }, [isHost, currentIndex, roomCode]);

    const handleAnswerSubmit = async (answerIndex) => {
        if (hasAnswered || showResult) return;
        setSelectedAnswer(answerIndex);
        setHasAnswered(true);

        // Gửi đáp án lên Firebase ngay lập tức
        await submitAnswer(currentIndex, answerIndex, timeLeft);
    };

    const calculateAndUpdateScores = async () => {
        if (!roomCode) return;

        try {
            // 1. Lấy câu hỏi hiện tại trực tiếp từ DB để tránh sai lệch Index
            const roomSnap = await get(ref(database, `game/${roomCode}`));
            const roomData = roomSnap.val();
            const activeIdx = roomData.currentQuestion;
            const correctIdx = Number(quizQuestions[activeIdx]?.correctIndex);

            console.log(`--- ĐANG TÍNH ĐIỂM CÂU ${activeIdx} | ĐÁP ÁN ĐÚNG: ${correctIdx} ---`);

            const allAnswers = roomData.answers || {};
            const allPlayers = roomData.players || {};
            const updates = {};

            // 2. Duyệt qua từng người chơi để kiểm tra đáp án
            Object.entries(allAnswers).forEach(([uid, userAns]) => {
                const answerData = userAns[activeIdx]; // Lấy đúng đáp án của câu hiện tại

                if (answerData && Number(answerData.answerIndex) === correctIdx) {
                    const timeBonus = Number(answerData.timeRemaining || 0);
                    let points = calculateQuizScore(timeBonus, QUESTION_TIME);
                    if (points <= 0) points = 100; // Bảo hiểm điểm tối thiểu

                    const currentScore = Number(allPlayers[uid]?.score || 0);
                    const newScore = currentScore + points;
                    const levelData = getLevelByPoints(newScore);

                    updates[`game/${roomCode}/players/${uid}/score`] = newScore;
                    updates[`game/${roomCode}/players/${uid}/level`] = levelData.id;
                    updates[`game/${roomCode}/players/${uid}/avatar`] = levelData.avatar;

                    console.log(`✅ Người chơi ${allPlayers[uid]?.name} (+${points}đ)`);
                }
            });

            // 3. Chỉ cập nhật nếu có người đúng
            if (Object.keys(updates).length > 0) {
                await update(ref(database), updates);
                console.log("Cập nhật điểm thành công!");
            } else {
                console.log("Không có ai trả lời đúng hoặc không tìm thấy đáp án.");
            }

            // 4. Cho phép chuyển sang câu tiếp theo
            if (onRoundEnd) onRoundEnd();

        } catch (error) {
            console.error("LỖI TÍNH ĐIỂM:", error);
        }
    };

    // BẢO VỆ 2: Nếu chưa có dữ liệu câu hỏi, hiện màn hình chờ để không bị crash
    if (!question) {
        return (
            <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-[110]">
                <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-amber-500 mx-auto mb-4"></div>
                    <p className="font-bold">Đang tải câu hỏi {currentIndex + 1}...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-gray-900/95 flex items-center justify-center z-[100] backdrop-blur-md"
        >
            <div className="max-w-2xl w-full mx-4 relative">
                {/* Header: Progress & Timer */}
                <div className="text-center mb-8">
                    <div className="flex justify-between items-end mb-2 px-2">
                        <span className="text-amber-400 font-mono font-bold">
                            CÂU HỎI {currentIndex + 1} / {quizQuestions.length}
                        </span>
                        <span className={`text-3xl font-black ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                            {timeLeft}s
                        </span>
                    </div>
                    <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
                        <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 via-green-400 to-red-500"
                            animate={{ width: `${(timeLeft / QUESTION_TIME) * 100}%` }}
                            transition={{ duration: 1, ease: "linear" }}
                        />
                    </div>
                </div>

                {/* Question Card */}
                <motion.div
                    key={currentIndex}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-gray-800 border-2 border-gray-700 rounded-3xl p-8 shadow-2xl mb-8 text-center"
                >
                    <h2 className="text-xl md:text-2xl text-white font-bold leading-tight">
                        {question.question}
                    </h2>
                </motion.div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {question.options.map((option, index) => {
                        const isSelected = selectedAnswer === index;
                        const isCorrect = showResult && index === question.correctIndex;
                        const isWrong = showResult && isSelected && index !== question.correctIndex;

                        return (
                            <button
                                key={`${currentIndex}-${index}`}
                                onClick={() => handleAnswerSubmit(index)}
                                disabled={hasAnswered || showResult}
                                className={`
                                    p-5 rounded-2xl text-left transition-all duration-200 flex items-center gap-4 border-b-4
                                    ${isSelected ? 'border-blue-800 translate-y-1' : 'border-black/20'}
                                    ${isCorrect ? 'bg-green-500 border-green-700' :
                                        isWrong ? 'bg-red-500 border-red-700' :
                                            isSelected ? 'bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'}
                                    ${(!hasAnswered && !showResult) ? 'cursor-pointer active:scale-95' : 'cursor-default'}
                                `}
                            >
                                <span className="w-8 h-8 rounded-lg bg-black/30 flex-shrink-0 flex items-center justify-center font-bold text-white shadow-inner">
                                    {String.fromCharCode(65 + index)}
                                </span>
                                <span className="text-white font-semibold">{option}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Explanation */}
                <AnimatePresence>
                    {showResult && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="mt-6 p-5 rounded-2xl bg-white/5 border border-white/10 text-center"
                        >
                            <p className="text-gray-300 text-sm leading-relaxed">
                                <span className="font-bold text-amber-400">Giải thích: </span>
                                {question.explanation}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default QuizComponent;