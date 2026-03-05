import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';

const EvolutionNotification = () => {
    const { evolutionNotification, clearEvolutionNotification } = useGame();

    useEffect(() => {
        if (evolutionNotification) {
            // SỬA: Chỉnh lại 2 giây cho đồng bộ với Context
            const timer = setTimeout(() => {
                clearEvolutionNotification();
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [evolutionNotification, clearEvolutionNotification]);

    return (
        <AnimatePresence>
            {evolutionNotification && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 flex items-center justify-center z-[100]"
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={clearEvolutionNotification}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
                    />

                    <motion.div
                        initial={{ scale: 0.5, y: 50, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.5, y: 20, opacity: 0 }}
                        className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 max-w-md mx-4 border-2 border-amber-500 shadow-2xl"
                    >
                        {/* HIỂN THỊ SỐ ĐIỂM CỘNG BAY LÊN */}
                        <motion.div
                            initial={{ y: 0, opacity: 0 }}
                            animate={{ y: -60, opacity: 1 }}
                            className="absolute top-0 left-0 right-0 text-center text-4xl font-black text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]"
                        >
                            +{evolutionNotification.addedPoints} PTS
                        </motion.div>

                        <div className="relative text-center">
                            <motion.div className="text-amber-400 text-lg font-bold mb-2">
                                🎉 EVOLUTION! 🎉
                            </motion.div>

                            <motion.div className="text-5xl mb-4">
                                {evolutionNotification.oldLevel.avatar} ➝ {evolutionNotification.newLevel.avatar}
                            </motion.div>

                            <h2 className="text-3xl font-bold text-white mb-2 uppercase tracking-wider">
                                {evolutionNotification.newLevel.name}
                            </h2>

                            <p className="text-gray-300 mb-6 text-sm italic">
                                "{evolutionNotification.newLevel.description}"
                            </p>

                            <button
                                onClick={clearEvolutionNotification}
                                className="bg-amber-500 hover:bg-amber-600 text-black font-black py-3 px-10 rounded-full transition-all active:scale-95 shadow-lg"
                            >
                                AWESOME!
                            </button>
                        </div>

                        {/* Thanh thời gian (Visual Timer) - Chạy trong 2 giây */}
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-700 rounded-b-3xl overflow-hidden">
                            <motion.div
                                initial={{ width: "100%" }}
                                animate={{ width: "0%" }}
                                transition={{ duration: 5, ease: "linear" }}
                                className="h-full bg-amber-500"
                            />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default EvolutionNotification;