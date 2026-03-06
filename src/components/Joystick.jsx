import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

const Joystick = ({ onMove, disabled = false }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isActive, setIsActive] = useState(false);
    const containerRef = useRef(null);
    const lastMoveTime = useRef(0); // Để tiết lưu (throttle)

    // CẤU HÌNH ĐỘ NHẠY
    const maxDistance = 50;  // Tăng vùng di chuyển lên một chút cho thoải mái
    const deadzone = 20;     // Tăng vùng chết lên 20px để tránh rung tay
    const throttleMs = 150;  // Chỉ gửi lệnh di chuyển mỗi 150ms (0.15 giây)

    const handleStart = useCallback((e) => {
        if (disabled) return;
        // Loại bỏ e.preventDefault() ở đây để tránh lỗi trên một số trình duyệt mobile mới
        setIsActive(true);
    }, [disabled]);

    const handleEnd = useCallback(() => {
        setIsActive(false);
        setPosition({ x: 0, y: 0 });
        if (onMove) onMove({ x: 0, y: 0 });
    }, [onMove]);

    const handleMove = useCallback((e) => {
        if (!isActive || disabled) return;

        const touch = e.touches ? e.touches[0] : e;
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let deltaX = touch.clientX - centerX;
        let deltaY = touch.clientY - centerY;

        // Tính khoảng cách theo công thức Pitago: $d = \sqrt{\Delta x^2 + \Delta y^2}$
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > maxDistance) {
            deltaX = (deltaX / distance) * maxDistance;
            deltaY = (deltaY / distance) * maxDistance;
        }

        setPosition({ x: deltaX, y: deltaY });

        // LOGIC TIẾT LƯU: Chỉ gửi tọa độ sau mỗi khoảng thời gian throttleMs
        const now = Date.now();
        if (now - lastMoveTime.current > throttleMs) {
            const moveX = Math.abs(deltaX) > deadzone ? (deltaX > 0 ? 1 : -1) : 0;
            const moveY = Math.abs(deltaY) > deadzone ? (deltaY > 0 ? 1 : -1) : 0;

            if (moveX !== 0 || moveY !== 0) {
                if (onMove) onMove({ x: moveX, y: moveY });
                lastMoveTime.current = now;
            }
        }
    }, [isActive, disabled, onMove, deadzone, throttleMs]);

    useEffect(() => {
        if (isActive) {
            window.addEventListener('touchmove', handleMove, { passive: false });
            window.addEventListener('touchend', handleEnd);
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleEnd);
        }
        return () => {
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
        };
    }, [isActive, handleMove, handleEnd]);

    return (
        <div
            ref={containerRef}
            onTouchStart={handleStart}
            onMouseDown={handleStart}
            className={`relative w-32 h-32 rounded-full shadow-inner ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                } bg-gray-900/80 border-4 border-gray-700`}
            style={{ touchAction: 'none' }}
        >
            {/* Vòng định hướng */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <div className="w-full h-[2px] bg-gray-500 absolute" />
                <div className="h-full w-[2px] bg-gray-500 absolute" />
            </div>

            <motion.div
                className="absolute w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-2xl z-10"
                style={{
                    left: '50%',
                    top: '50%',
                    x: position.x - 28, // 28 là nửa chiều rộng (56/2)
                    y: position.y - 28,
                }}
                transition={{ type: 'just' }} // Dùng 'just' để joystick bám sát ngón tay hơn
            >
                <div className="absolute inset-0 rounded-full border-t-2 border-white/30" />
            </motion.div>
        </div>
    );
};

export default Joystick;