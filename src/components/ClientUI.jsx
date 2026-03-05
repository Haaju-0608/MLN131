import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import GameMap from './GameMap';
import QuizComponent from './QuizComponent';
import Leaderboard from './Leaderboard';
import EvolutionNotification from './EvolutionNotification';
import Joystick from './Joystick';
import { getLevelByPoints, getLevelProgress } from '../utils/EvolutionLogic';

const ClientUI = () => {
    const {
        roomCode,
        gameStatus,
        playerData,
        updatePosition,
    } = useGame();

    const [showLeaderboard, setShowLeaderboard] = useState(true);
    const [playerPos, setPlayerPos] = useState({ x: 5, y: 5 });

    // Đồng bộ vị trí từ database về local state của Client
    useEffect(() => {
        if (playerData?.pos) {
            setPlayerPos(playerData.pos);
        }
    }, [playerData?.pos]);

    // Handle joystick movement
    const handleJoystickMove = useCallback((direction) => {
        // Khóa di chuyển khi đang làm Quiz
        if (gameStatus === 'QUIZ') return;

        if (direction.x === 0 && direction.y === 0) return;

        // Tính toán vị trí mới (giới hạn trong map 20x15)
        const newX = Math.max(0, Math.min(19, playerPos.x + direction.x));
        const newY = Math.max(0, Math.min(14, playerPos.y + direction.y));

        if (newX !== playerPos.x || newY !== playerPos.y) {
            setPlayerPos({ x: newX, y: newY });
            updatePosition(newX, newY);
        }
    }, [gameStatus, playerPos, updatePosition]);

    const levelInfo = getLevelByPoints(playerData?.score || 0);
    const progress = getLevelProgress(playerData?.score || 0);

    // TRƯỜNG HỢP 1: ĐANG LÀM CÂU HỎI
    if (gameStatus === 'QUIZ') {
        return (
            <div className="h-screen bg-gray-900 fixed inset-0 z-[100]">
                <QuizComponent />
                <EvolutionNotification />
            </div>
        );
    }

    // TRƯỜNG HỢP 2: HIỆN MAP (LOBBY HOẶC SAU KHI TRẢ LỜI XONG)
    return (
        <div className="h-screen bg-gray-900 flex flex-col overflow-hidden fixed inset-0">
            {/* Header */}
            <div className="bg-gray-800/90 p-2 sm:p-3 flex items-center justify-between border-b border-gray-700 backdrop-blur-sm z-20">
                <div className="flex items-center gap-2 sm:gap-3">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-xl sm:text-2xl"
                    >
                        {playerData?.avatar || '👶'}
                    </motion.div>

                    <div className="leading-tight">
                        <div className="text-white font-bold text-sm sm:text-base truncate max-w-[80px]">
                            {playerData?.name || 'Guest'}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-400">
                            {levelInfo.title}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="text-right">
                        <div className="text-yellow-400 font-bold text-base sm:text-lg leading-none">
                            {playerData?.score || 0}
                        </div>
                        <div className="text-[10px] text-gray-400 uppercase">pts</div>
                    </div>

                    <div className="w-16 sm:w-24">
                        <div className="text-[10px] text-gray-400 mb-0.5">Lvl {progress.currentLevel}</div>
                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 to-amber-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress.progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Game Area */}
            <div className="flex-1 relative overflow-hidden bg-gray-950">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="transform scale-[0.85] sm:scale-100 origin-center">
                        <GameMap isHost={false} />
                    </div>
                </div>

                {/* Overlays */}
                <div className="absolute inset-0 pointer-events-none z-10">
                    <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-[10px] pointer-events-auto">
                        Room: <span className="font-bold text-yellow-400">{roomCode}</span>
                    </div>

                    <div className="absolute top-2 right-2 pointer-events-auto">
                        <button
                            onClick={() => setShowLeaderboard(!showLeaderboard)}
                            className="bg-gray-800/80 text-white px-2 py-1 rounded text-[10px] border border-gray-600"
                        >
                            {showLeaderboard ? '👁️ Hide' : '👁️ Show'} Leaderboard
                        </button>
                    </div>

                    <div className="absolute top-10 right-2 pointer-events-auto">
                        <Leaderboard show={showLeaderboard} />
                    </div>
                </div>

                {/* Joystick cho Mobile */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 md:hidden z-50 pointer-events-auto">
                    <Joystick onMove={handleJoystickMove} disabled={gameStatus === 'QUIZ'} />
                </div>

                {/* Kết quả sau mỗi câu (Overlay) */}
                {gameStatus === 'RESULTS' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 z-[60] p-4 pointer-events-auto"
                    >
                        <div className="bg-gray-800 rounded-2xl p-6 text-center border-2 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                            <h2 className="text-xl font-bold text-white mb-2">🏁 Round Finished!</h2>
                            <p className="text-gray-400 text-sm mb-1">Waiting for the next question...</p>
                            <div className="text-3xl font-black text-yellow-400">{playerData?.score || 0}</div>
                            <p className="text-[10px] text-gray-500 uppercase">Current Total Score</p>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Footer Status */}
            <div className="bg-gray-800 p-2 flex justify-center border-t border-gray-700">
                <span className={`px-4 py-1 rounded-full text-xs font-bold ${gameStatus === 'LOBBY' ? 'bg-blue-600' : 'bg-purple-600'
                    }`}>
                    {gameStatus === 'LOBBY' ? '⏳ Waiting for Host' : '📊 Reviewing Results'}
                </span>
            </div>
        </div>
    );
};

export default ClientUI;