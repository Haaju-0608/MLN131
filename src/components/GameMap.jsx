import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { getLevelByPoints, getBackgroundForLevel } from '../utils/EvolutionLogic';

const GRID_WIDTH = 20;
const GRID_HEIGHT = 15;
const CELL_SIZE = 50;

const GameMap = ({ isHost = false, onPlayerClick }) => {
    const {
        players,
        playerData,
        gameStatus,
        roomCode,
        user,
        updatePosition
    } = useGame();

    const [playerPos, setPlayerPos] = useState({ x: 5, y: 5 });
    const keysPressed = useRef({});
    const moveInterval = useRef(null);
    const positionRef = useRef({ x: 5, y: 5 });

    const backgroundInfo = getBackgroundForLevel(playerData.level);

    // --- 1. ĐỊNH NGHĨA CÁC HÀM CƠ BẢN TRƯỚC ---

    const stopMovement = useCallback(() => {
        if (moveInterval.current) {
            clearInterval(moveInterval.current);
            moveInterval.current = null;
        }
    }, []);

    const movePlayer = useCallback(() => {
        if (gameStatus !== 'LOBBY') return;

        let { x, y } = positionRef.current;
        let moved = false;

        if (keysPressed.current['arrowup'] || keysPressed.current['w']) {
            y = Math.max(0, y - 1); moved = true;
        } else if (keysPressed.current['arrowdown'] || keysPressed.current['s']) {
            y = Math.min(GRID_HEIGHT - 1, y + 1); moved = true;
        }

        if (keysPressed.current['arrowleft'] || keysPressed.current['a']) {
            x = Math.max(0, x - 1); moved = true;
        } else if (keysPressed.current['arrowright'] || keysPressed.current['d']) {
            x = Math.min(GRID_WIDTH - 1, x + 1); moved = true;
        }

        if (moved) {
            const newPos = { x, y };
            positionRef.current = newPos;
            setPlayerPos(newPos);
            updatePosition(x, y);
        }
    }, [gameStatus, updatePosition]);

    const startMovement = useCallback(() => {
        if (!moveInterval.current) {
            moveInterval.current = setInterval(movePlayer, 150);
        }
    }, [movePlayer]);

    // --- 2. CÁC EFFECT THEO DÕI THAY ĐỔI ---

    // Khởi tạo vị trí từ Firebase khi vào game
    useEffect(() => {
        if (playerData.pos) {
            positionRef.current = playerData.pos;
            setPlayerPos(playerData.pos);
        }
    }, []);

    // Lắng nghe phím bấm
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (gameStatus !== 'LOBBY') return;
            const key = e.key.toLowerCase();
            const moveKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'];

            if (moveKeys.includes(key)) {
                e.preventDefault();
                keysPressed.current[key] = true;
                startMovement();
            }
        };

        const handleKeyUp = (e) => {
            const key = e.key.toLowerCase();
            keysPressed.current[key] = false;
            const stillPressing = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']
                .some(k => keysPressed.current[k]);
            if (!stillPressing) stopMovement();
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            stopMovement();
        };
    }, [gameStatus, startMovement, stopMovement]);

    // --- 3. RENDERING ---

    const renderGrid = () => {
        const cells = [];
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const isBorder = x === 0 || x === GRID_WIDTH - 1 || y === 0 || y === GRID_HEIGHT - 1;
                cells.push(
                    <div
                        key={`${x}-${y}`}
                        className={`flex items-center justify-center border ${isBorder ? 'bg-gray-800 border-gray-700' : 'bg-gray-900/50 border-gray-800'
                            }`}
                        style={{ width: CELL_SIZE, height: CELL_SIZE }}
                    >
                        {!isBorder && <div className="w-1 h-1 bg-gray-700 rounded-full" />}
                    </div>
                );
            }
        }
        return cells;
    };

    const renderPlayers = () => {
        return Object.entries(players).map(([uid, player]) => {
            const isCurrentPlayer = uid === user?.uid;
            const isHostPlayer = player.isHost;

            return (
                <motion.div
                    key={uid}
                    className={`absolute flex items-center justify-center ${isCurrentPlayer ? 'z-20' : 'z-10'}`}
                    style={{
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        transform: `translate(${player.pos.x * CELL_SIZE}px, ${player.pos.y * CELL_SIZE}px)`,
                        transition: 'transform 0.15s linear',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                    }}
                    onClick={() => onPlayerClick && onPlayerClick(uid, player)}
                >
                    <motion.div
                        animate={isCurrentPlayer && gameStatus !== 'QUIZ' ? { y: [0, -3, 0] } : {}}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className={`text-2xl bg-gray-800/80 rounded-full p-1 ring-2 ${isHostPlayer ? 'ring-yellow-500' : 'ring-blue-500'
                            } ${isCurrentPlayer ? 'evolution-glow' : ''}`}
                    >
                        {player.avatar}
                    </motion.div>
                    <div className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs px-1 py-0.5 bg-gray-900/90 rounded ${isCurrentPlayer ? 'text-yellow-400' : 'text-gray-300'
                        }`}>
                        {player.name}
                    </div>
                </motion.div>
            );
        });
    };

    return (
        // 1. Container chính: Đảm bảo luôn cho phép cuộn dọc (overflow-y-auto)
        <div className="relative min-h-screen w-full flex flex-col items-center overflow-y-auto overflow-x-hidden py-6 px-4">

            {/* Background: Dùng 'fixed' để khi bạn cuộn trang, hình nền vẫn đứng yên trông sẽ chuyên nghiệp hơn */}
            <div className={`fixed inset-0 ${backgroundInfo.cssClass} bg-cover bg-center -z-10`} />
            <div className="fixed inset-0 bg-black/40 -z-10" />

            {/* Room Code: Cho hiển thị ở trên cùng cho dễ nhìn trên mọi thiết bị */}
            {roomCode && (
                <div className="mb-4 z-20 text-sm bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/20 shadow-xl">
                    Room: <span className="font-bold text-yellow-400 font-mono">{roomCode}</span>
                </div>
            )}

            {/* 2. Map Wrapper: Giúp điện thoại có thể vuốt ngang để xem hết bản đồ */}
            <div className="w-full max-w-full overflow-x-auto pb-6 custom-scrollbar flex justify-start md:justify-center">
                <div
                    className="relative border-4 border-gray-800 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden bg-gray-900/50"
                    style={{
                        width: GRID_WIDTH * CELL_SIZE,
                        height: GRID_HEIGHT * CELL_SIZE,
                        minWidth: GRID_WIDTH * CELL_SIZE // Ép bản đồ không bị co lại trên mobile
                    }}
                >
                    {/* Grid tầng dưới */}
                    <div className="grid" style={{
                        gridTemplateColumns: `repeat(${GRID_WIDTH}, ${CELL_SIZE}px)`,
                        gridTemplateRows: `repeat(${GRID_HEIGHT}, ${CELL_SIZE}px)`,
                    }}>
                        {renderGrid()}
                    </div>

                    {/* Nhân vật tầng trên */}
                    {renderPlayers()}
                </div>
            </div>

            {/* 3. Hint: Đưa xuống dưới bản đồ để không che khuất tầm nhìn */}
            {gameStatus !== 'QUIZ' && (
                <div className="mt-4 z-20 text-xs text-gray-300 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10 animate-bounce">
                    🎮 Dùng phím mũi tên hoặc WASD để di chuyển
                </div>
            )}

            {/* CSS bổ sung để ẩn thanh cuộn xấu xí trên mobile (tùy chọn) */}
            <style dangerouslySetInnerHTML={{
                __html: `
            .custom-scrollbar::-webkit-scrollbar { height: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        `}} />
        </div>
    );
};

export default GameMap;