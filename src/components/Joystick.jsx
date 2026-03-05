import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

const Joystick = ({ onMove, disabled = false }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isActive, setIsActive] = useState(false);
    const containerRef = useRef(null);
    const maxDistance = 40;

    const handleStart = useCallback((e) => {
        if (disabled) return;
        e.preventDefault();
        setIsActive(true);
    }, [disabled]);

    const handleEnd = useCallback(() => {
        setIsActive(false);
        setPosition({ x: 0, y: 0 });
        if (onMove) {
            onMove({ x: 0, y: 0 });
        }
    }, [onMove]);

    const handleMove = useCallback((e) => {
        if (!isActive || disabled) return;
        e.preventDefault();

        const touch = e.touches ? e.touches[0] : e;
        const container = containerRef.current;

        if (!container) return;

        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let deltaX = touch.clientX - centerX;
        let deltaY = touch.clientY - centerY;

        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance > maxDistance) {
            deltaX = (deltaX / distance) * maxDistance;
            deltaY = (deltaY / distance) * maxDistance;
        }

        setPosition({ x: deltaX, y: deltaY });

        const moveX = Math.abs(deltaX) > 10 ? (deltaX > 0 ? 1 : -1) : 0;
        const moveY = Math.abs(deltaY) > 10 ? (deltaY > 0 ? 1 : -1) : 0;

        if (Math.abs(moveX) > 0 || Math.abs(moveY) > 0) {
            if (onMove) {
                onMove({ x: moveX, y: moveY });
            }
        }
    }, [isActive, disabled, onMove]);

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
            className={`relative w-32 h-32 rounded-full ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                } bg-gray-800/50 border-2 border-gray-600`}
            style={{ touchAction: 'none' }}
        >
            <div className="absolute inset-4 rounded-full bg-gray-700/50" />

            <motion.div
                className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg"
                animate={{
                    left: `calc(50% - 24px + ${position.x}px)`,
                    top: `calc(50% - 24px + ${position.y}px)`,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white/50 rounded-full" />
                </div>
            </motion.div>

            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-400">↑</div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-400">↓</div>
            <div className="absolute top-1/2 -left-6 -translate-y-1/2 text-xs text-gray-400">←</div>
            <div className="absolute top-1/2 -right-6 -translate-y-1/2 text-xs text-gray-400">→</div>
        </div>
    );
};

export default Joystick;

