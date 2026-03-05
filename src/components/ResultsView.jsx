import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGame } from '../context/GameContext';

const ResultsView = () => {
    const { players } = useGame();

    // Sắp xếp danh sách người chơi theo điểm
    const sortedPlayers = Object.values(players || {})
        .sort((a, b) => (b.score || 0) - (a.score || 0));

    const winner = sortedPlayers[0];

    useEffect(() => {
        // Hiệu ứng pháo hoa rực rỡ
        const end = Date.now() + 4 * 1000;
        const colors = ['#fbbf24', '#3b82f6', '#22c55e'];

        (function frame() {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: colors
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: colors
            });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
    }, []);

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-white overflow-y-auto">
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center mb-8"
            >
                <div className="text-9xl mb-4">🏆</div>
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600 uppercase">
                    The Ultimate Worker 4.0
                </h1>
                {winner && (
                    <p className="text-3xl mt-4 font-bold text-blue-400">
                        Chúc mừng {winner.name} đã dẫn đầu cuộc cách mạng!
                    </p>
                )}
            </motion.div>

            {/* Bảng điểm tổng kết */}
            <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-white/10 mb-8">
                <h3 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">Bảng phong thần</h3>
                {sortedPlayers.slice(0, 5).map((player, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2">
                        <span className="flex gap-2">
                            <span className="text-gray-500">#{idx + 1}</span>
                            <span>{player.avatar} {player.name}</span>
                        </span>
                        <span className="font-mono text-amber-400 font-bold">{player.score} pts</span>
                    </div>
                ))}
            </div>

            {/* THÔNG ĐIỆP KẾT THÚC MLN131 */}
            {/* THÔNG ĐIỆP KẾT THÚC MLN131 - ĐÃ TỐI ƯU THEO SLOGAN CỦA HẬU */}
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="max-w-2xl bg-gradient-to-br from-blue-900/40 to-purple-900/40 p-8 rounded-3xl border border-blue-500/30 shadow-2xl text-center"
            >
                <h2 className="text-2xl font-bold text-blue-300 mb-4">💡 Thông điệp từ "The Ultimate Worker 4.0"</h2>
                <div className="space-y-4 text-gray-200 leading-relaxed">
                    <p className="italic">
                        "Sứ mệnh của giai cấp công nhân trong kỷ nguyên số không phải là đối đầu với máy móc, mà là làm chủ chúng."
                    </p>
                    <div className="py-4">
                        <p className="text-2xl font-black text-white leading-tight uppercase tracking-wider">
                            "Công nhân <span className="text-red-500">không bị thay thế</span> bởi AI,<br />
                            mà là công nhân <span className="text-green-400">dùng AI</span> sẽ thay thế <br />
                            công nhân không dùng AI"
                        </p>
                    </div>
                </div>
                <div className="mt-6 pt-6 border-t border-white/10">
                    <p className="text-amber-500 font-black text-xl tracking-widest">
                        XÂY DỰNG GIAI CẤP CÔNG NHÂN VIỆT NAM HIỆN ĐẠI - LỚN MẠNH
                    </p>
                </div>
            </motion.div>

            <button
                onClick={() => window.location.reload()}
                className="mt-10 px-10 py-4 bg-white/10 hover:bg-white/20 rounded-full font-bold transition-all border border-white/20"
            >
                🔄 Quay lại Trang chủ
            </button>
        </div>
    );
};

export default ResultsView;