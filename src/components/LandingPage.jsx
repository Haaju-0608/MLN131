import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

const LandingPage = () => {
    // 1. Lấy thêm isMuted, toggleMute, playMusic từ Context
    const { createRoom, joinRoom, loading, isMuted, toggleMute, playMusic } = useGame();

    const [name, setName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [mode, setMode] = useState('join');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const generateRoomCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    // 2. Tạo hàm xử lý chung để "kích hoạt" nhạc khi nhấn nút
    const handleAction = async (e) => {
        e.preventDefault();
        playMusic();

        const currentName = name.trim(); // Lưu tên vào biến cục bộ ngay lập tức
        if (!currentName) {
            setError('Please enter your name');
            return;
        }

        if (mode === 'create') {
            const adminPassword = prompt("Nhập mật mã Admin để tạo phòng:");
            if (adminPassword === "12345") {
                const currentName = name.trim();
                setIsLoading(true);
                try {
                    // 1. Tạo mã phòng ngẫu nhiên 4 chữ cái (ví dụ: ABCD)
                    const newCode = Math.random().toString(36).substring(2, 6).toUpperCase();

                    // 2. Truyền ĐỦ 2 tham số: code và name
                    await createRoom(newCode, currentName);

                    console.log("Tạo phòng thành công:", newCode);
                } catch (err) {
                    setError("Lỗi tạo phòng: " + err.message);
                } finally {
                    setIsLoading(false);
                }
            } else if (adminPassword !== null) {
                setError("Mật mã sai!");
            }
        } else {
            // Logic Join giữ nguyên nhưng dùng currentName
            if (!roomCode.trim()) {
                setError('Please enter a room code');
                return;
            }
            setIsLoading(true);
            const success = await joinRoom(roomCode.toUpperCase(), currentName);
            if (!success) setError('Room not found');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col items-center justify-start md:justify-center p-4 overflow-y-auto relative">

            {/* 3. CHÈN NÚT ÂM THANH VÀO ĐÂY (Nằm ngoài motion.div để cố định ở góc) */}
            <button
                type="button"
                onClick={() => {
                    toggleMute();
                    playMusic(); // Đổi trạng thái
                }}
                className="fixed top-4 right-4 z-[1000] p-3 bg-gray-800/80 text-white rounded-full hover:bg-gray-700 transition-all border border-amber-500/50 shadow-lg"
            >
                {isMuted ? <FaVolumeMute size={24} /> : <FaVolumeUp size={24} />}
            </button>

            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="relative z-10 w-full max-w-md py-6"
            >
                {/* Title */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', duration: 0.8 }}
                        className="text-5xl md:text-6xl mb-4"
                    >
                        👨‍🔧➡️🤖
                    </motion.div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                        The Great Escape
                    </h1>
                    <h2 className="text-lg md:text-xl text-blue-400 font-semibold italic">
                        Worker 4.0 Evolution
                    </h2>
                </div>

                {/* Mode Toggle */}
                <div className="flex mb-6 bg-gray-800/80 p-1 rounded-xl border border-gray-700">
                    <button
                        onClick={() => { setMode('join'); setError(''); playMusic(); }}
                        className={`flex-1 py-3 rounded-lg font-bold transition-all ${mode === 'join' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Join Game
                    </button>
                    <button
                        onClick={() => { setMode('create'); setError(''); playMusic(); }}
                        className={`flex-1 py-3 rounded-lg font-bold transition-all ${mode === 'create' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Create Room
                    </button>
                </div>

                {/* Form Card */}
                <div className="bg-gray-800/90 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-gray-700">
                    <form onSubmit={handleAction}>
                        <div className="mb-4">
                            <label className="block text-gray-300 text-sm font-medium mb-2 ml-1">Your Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="What's your name?"
                                className="w-full px-4 py-3 bg-gray-900/50 text-white rounded-xl border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                            />
                        </div>

                        {mode === 'join' && (
                            <div className="mb-6">
                                <label className="block text-gray-300 text-sm font-medium mb-2 ml-1">Room Code</label>
                                <input
                                    type="text"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                    placeholder="ABCD"
                                    maxLength={4}
                                    className="w-full px-4 py-3 bg-gray-900/50 text-white rounded-xl border border-gray-600 focus:border-blue-500 focus:outline-none transition-all text-center text-2xl font-black tracking-[0.5em] uppercase"
                                />
                            </div>
                        )}

                        {error && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || loading}
                            className={`w-full py-4 rounded-xl font-black text-lg shadow-xl transition-all active:scale-95 ${mode === 'create' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-500'} text-white`}
                        >
                            {isLoading || loading ? "LOADING..." : (mode === 'create' ? '🎮 CREATE ROOM' : '🚪 JOIN GAME')}
                        </button>
                    </form>
                </div>

                {/* Evolution Info & Instructions giữ nguyên như code của bạn */}
                <div className="mt-8 grid grid-cols-3 gap-2">
                    {[
                        { icon: '👨‍🔧', lv: 'Lv.1', pts: '0-1500', color: 'text-amber-400' },
                        { icon: '👷‍♂️', lv: 'Lv.2', pts: '1501-4000', color: 'text-green-400' },
                        { icon: '🤖', lv: 'Lv.3', pts: '4k+', color: 'text-blue-400' }
                    ].map((item, i) => (
                        <div key={i} className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-2 border border-white/5 text-center">
                            <div className="text-xl md:text-2xl mb-1">{item.icon}</div>
                            <div className="text-[10px] uppercase tracking-widest text-gray-500">{item.lv}</div>
                            <div className={`text-[10px] font-bold ${item.color}`}>{item.pts}</div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default LandingPage;