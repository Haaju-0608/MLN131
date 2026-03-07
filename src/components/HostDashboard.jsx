import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import GameMap from './GameMap';
import { quizQuestions } from '../data/quizQuestions';
import { ref, set, get, update, onValue } from 'firebase/database';
import { calculateQuizScore, getLevelByPoints } from '../utils/EvolutionLogic';
import { database } from '../utils/FirebaseConfig';
import { QRCodeSVG } from 'qrcode.react';

const QUESTION_TIME = 10;

const HostDashboard = () => {
    const {
        roomCode,
        isHost,
        gameStatus,
        players,
        startQuiz,
        returnToLobby,
        questionStartTime,
        currentQuestion
    } = useGame();

    const [questionIndex, setQuestionIndex] = useState(0);
    const [isStarting, setIsStarting] = useState(false);
    const [liveAnswers, setLiveAnswers] = useState({});
    const mapRef = useRef(null);
    const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);

    useEffect(() => {
        if (!questionStartTime) return;

        const interval = setInterval(() => {
            const elapsed = (Date.now() - questionStartTime) / 1000;
            const remaining = Math.max(QUESTION_TIME - elapsed, 0);

            setTimeLeft(Math.ceil(remaining));

            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 200);

        return () => clearInterval(interval);
    }, [questionStartTime]);

    useEffect(() => {
        if (currentQuestion !== undefined && currentQuestion !== null) {
            setQuestionIndex(currentQuestion);
        }
    }, [currentQuestion]);

    // listen realtime answers
    useEffect(() => {
        if (!roomCode) return;

        const answersRef = ref(database, `game/${roomCode}/answers`);

        return onValue(answersRef, (snapshot) => {
            setLiveAnswers(snapshot.val() || {});
        });
    }, [roomCode]);

    // sort players
    const sortedPlayers = Object.entries(players || {})
        .map(([uid, player]) => ({ uid, ...player }))
        .sort((a, b) => (b.score || 0) - (a.score || 0));

    // start quiz
    const handleStartQuiz = async () => {
        if (!isHost || sortedPlayers.length === 0) return;

        setIsStarting(true);

        const updates = {};
        updates[`game/${roomCode}/answers`] = null;
        updates[`game/${roomCode}/currentQuestion`] = 0;
        updates[`game/${roomCode}/questionStartTime`] = Date.now();

        await update(ref(database), updates);

        setQuestionIndex(0);
        await startQuiz();

        setIsStarting(false);
    };

    // show results
    const handleShowResults = async () => {
        try {
            await set(ref(database, `game/${roomCode}/status`), 'RESULTS');

            const gameSnap = await get(ref(database, `game/${roomCode}`));
            const gameData = gameSnap.val();

            if (!gameData || !gameData.answers) return;

            const activeIdx = gameData.currentQuestion;
            const correctIdx = Number(quizQuestions[activeIdx]?.correctIndex);

            const updates = {};

            Object.entries(gameData.answers).forEach(([uid, userAnswers]) => {
                const answer = userAnswers[activeIdx];

                if (answer && Number(answer.answerIndex) === correctIdx) {

                    const timeBonus = Number(answer.timeRemaining || 0);
                    let points = calculateQuizScore(timeBonus, QUESTION_TIME);
                    if (points <= 0) points = 100;

                    const oldScore = Number(gameData.players[uid]?.score || 0);
                    const newScore = oldScore + points;

                    const levelData = getLevelByPoints(newScore);

                    updates[`game/${roomCode}/players/${uid}/score`] = newScore;
                    updates[`game/${roomCode}/players/${uid}/level`] = levelData.id;
                    updates[`game/${roomCode}/players/${uid}/avatar`] = levelData.avatar;
                }
            });

            if (Object.keys(updates).length > 0) {
                await update(ref(database), updates);
            }

        } catch (error) {
            console.error("Score error:", error);
        }
    };

    const handleReturnToLobby = async () => {
        await returnToLobby();
        setQuestionIndex(0);
    };

    const handleNextQuestion = async () => {

        const isLastQuestion = questionIndex >= quizQuestions.length - 1;

        if (!isLastQuestion) {

            const nextIndex = questionIndex + 1;

            const updates = {};
            updates[`game/${roomCode}/currentQuestion`] = nextIndex;
            updates[`game/${roomCode}/questionStartTime`] = Date.now();
            updates[`game/${roomCode}/status`] = 'QUIZ';
            updates[`game/${roomCode}/answers`] = null;

            await update(ref(database), updates);

        } else {

            await set(ref(database, `game/${roomCode}/status`), 'FINAL_RESULTS');

        }
    };

    if (!isHost) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="text-white text-xl">
                    Access denied. Only the host can view this page.
                </div>
            </div>
        );
    }

    const answerCount = Object.keys(liveAnswers || {}).length;

    return (
        <div className="h-screen bg-gray-900 flex flex-col">

            {/* Header */}
            <div className="bg-gray-800 p-4 flex justify-between border-b border-gray-700">

                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-white">
                        🎮 Host Dashboard
                    </h1>
                    <div className="timer">
                        ⏳ {timeLeft}s
                    </div>

                    <span className="bg-yellow-600 px-3 py-1 rounded text-white text-sm font-bold">
                        HOST
                    </span>
                </div>

                <div className="text-gray-400">
                    Room:
                    <span className="text-yellow-400 font-bold text-lg ml-2">
                        {roomCode}
                    </span>
                </div>

            </div>

            {/* QR lobby */}
            {gameStatus === 'LOBBY' && (
                <div className="bg-gray-800 p-4 border-b border-gray-700 text-center">

                    <p className="text-gray-400 mb-2">Scan to Join</p>

                    <div className="bg-white inline-block p-2 rounded">

                        <QRCodeSVG
                            value={`https://mln-131-beta.vercel.app/game/${roomCode}`}
                            size={180}
                            level="H"
                        />

                    </div>

                    <p className="text-white font-mono text-xl mt-2">
                        {roomCode}
                    </p>

                </div>
            )}

            <div className="flex-1 flex overflow-hidden">

                {/* MAP */}
                <div className="flex-1 flex items-center justify-center bg-gray-950 p-4">

                    <div ref={mapRef}>
                        <GameMap isHost={true} />
                    </div>

                </div>

                {/* CONTROL PANEL */}
                <div className="w-80 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">

                    {/* Status */}
                    <div className="mb-4">

                        <h3 className="text-white font-bold mb-2">
                            Game Status
                        </h3>

                        <div className="bg-blue-600 text-white text-center py-2 rounded font-bold">
                            {gameStatus}
                        </div>

                    </div>

                    {/* QUIZ INFO */}
                    {gameStatus === 'QUIZ' && (

                        <div className="bg-gray-700 rounded p-3 mb-4">

                            <p className="text-gray-300 text-sm">
                                {quizQuestions[questionIndex]?.question}
                            </p>

                            <div className="text-xs text-gray-400 mt-2">
                                Correct:
                                {String.fromCharCode(
                                    65 + (quizQuestions[questionIndex]?.correctIndex ?? 0)
                                )}
                            </div>

                            <div className="text-xs text-yellow-400 mt-2">
                                Answers: {answerCount}/{sortedPlayers.length}
                            </div>

                        </div>

                    )}

                    {/* BUTTONS */}
                    {gameStatus === 'LOBBY' && (
                        <button
                            onClick={handleStartQuiz}
                            disabled={sortedPlayers.length === 0 || isStarting}
                            className="w-full py-3 bg-green-600 rounded font-bold text-white"
                        >
                            🚀 Start Round
                        </button>
                    )}

                    {gameStatus === 'QUIZ' && (
                        <button
                            onClick={handleShowResults}
                            className="w-full py-3 bg-purple-600 rounded font-bold text-white"
                        >
                            📊 Show Results
                        </button>
                    )}

                    {gameStatus === 'RESULTS' && (
                        <button
                            onClick={handleNextQuestion}
                            className="w-full py-3 bg-blue-600 rounded font-bold text-white"
                        >
                            ➡️ Next Question
                        </button>
                    )}

                    {/* PLAYER LIST */}
                    <div className="mt-6">

                        <h3 className="text-white font-bold mb-2">
                            Players ({sortedPlayers.length})
                        </h3>

                        <div className="space-y-2">

                            {sortedPlayers.map((player, idx) => {

                                const userAnswer = liveAnswers?.[player.uid]?.[questionIndex];

                                const isCorrect =
                                    userAnswer &&
                                    Number(userAnswer.answerIndex) ===
                                    quizQuestions[questionIndex]?.correctIndex;

                                return (

                                    <div
                                        key={player.uid}
                                        className="flex justify-between items-center bg-gray-700 p-2 rounded"
                                    >

                                        <div className="flex items-center gap-2">

                                            <span className="text-gray-400 text-sm">
                                                #{idx + 1}
                                            </span>

                                            <span>{player.avatar}</span>

                                            <span className="text-white text-sm">
                                                {player.name}
                                            </span>

                                        </div>

                                        <div className="flex items-center gap-2">

                                            {gameStatus === 'QUIZ' && (
                                                <span>
                                                    {userAnswer ? "✅" : "⏳"}
                                                </span>
                                            )}

                                            {gameStatus === 'RESULTS' && (
                                                <span>
                                                    {isCorrect ? "💎" : "❌"}
                                                </span>
                                            )}

                                            <span className="text-yellow-400 font-bold">
                                                {player.score || 0}
                                            </span>

                                        </div>

                                    </div>

                                );

                            })}

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default HostDashboard;