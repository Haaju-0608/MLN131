import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { getLevelByPoints } from '../utils/EvolutionLogic';

const Leaderboard = ({ show = true }) => {
    const { players } = useGame();

    // Dùng useMemo để chỉ tính toán lại khi danh sách players thay đổi
    const sortedPlayers = useMemo(() => {
        return Object.entries(players)
            .map(([uid, player]) => ({
                uid,
                ...player,
                levelInfo: getLevelByPoints(player.score || 0),
            }))
            .sort((a, b) => (b.score || 0) - (a.score || 0));
    }, [players]);

    if (!show) return null;

    return (
        <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            // Fix: Thay đổi top và width để mobile không bị che hết màn hình
            className="fixed right-2 top-16 w-48 sm:w-64 bg-gray-900/90 rounded-2xl p-3 sm:p-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] z-40 border border-gray-700 backdrop-blur-sm"
        >
            <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="text-yellow-500">🏆</span> Rank
                </h3>
                <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full border border-gray-700">
                    {sortedPlayers.length} Online
                </span>
            </div>

            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <AnimatePresence mode='popLayout'>
                    {sortedPlayers.map((player, index) => (
                        <motion.div
                            layout // Tự động trượt mượt mà khi đổi thứ hạng
                            key={player.uid}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className={`
                                flex items-center justify-between p-2 sm:p-3 rounded-xl transition-colors
                                ${index === 0 ? 'bg-gradient-to-r from-yellow-900/40 to-transparent border-l-4 border-yellow-500' : 'bg-gray-800/50'}
                                ${index === 1 ? 'border-l-4 border-gray-400' : ''}
                                ${index === 2 ? 'border-l-4 border-orange-600' : ''}
                            `}
                        >
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <div className={`
                                    flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-xs
                                    ${index === 0 ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.4)]' :
                                        index === 1 ? 'bg-gray-400 text-black' :
                                            index === 2 ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-400'}
                                `}>
                                    {index + 1}
                                </div>

                                <div className="truncate">
                                    <div className="text-white text-xs sm:text-sm font-bold truncate flex items-center gap-1">
                                        {player.name}
                                        {player.isHost && <span className="text-[8px] bg-indigo-600 text-white px-1 rounded uppercase">Host</span>}
                                    </div>
                                    <div className="text-[9px] sm:text-[10px] text-gray-400 flex items-center gap-1">
                                        {player.levelInfo.emoji} {player.levelInfo.title}
                                    </div>
                                </div>
                            </div>

                            <div className="text-right ml-2">
                                <motion.div
                                    key={player.score} // Hiệu ứng nhảy số khi điểm đổi
                                    initial={{ y: -10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="text-yellow-400 font-black text-xs sm:text-sm"
                                >
                                    {player.score || 0}
                                </motion.div>
                                <div className="text-[8px] text-gray-500 uppercase font-bold">pts</div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {sortedPlayers.length === 0 && (
                <div className="text-gray-500 text-center py-6 italic text-xs">
                    Waiting for players...
                </div>
            )}
        </motion.div>
    );
};

export default Leaderboard;