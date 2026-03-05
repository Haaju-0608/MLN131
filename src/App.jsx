import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GameProvider, useGame } from './context/GameContext';
import LandingPage from './components/LandingPage';
import HostDashboard from './components/HostDashboard';
import ClientUI from './components/ClientUI';
import ResultsView from './components/ResultsView';
import EvolutionNotification from './components/EvolutionNotification';

// Loading screen component
const LoadingScreen = () => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="text-4xl mb-4"
            >
                ⚙️
            </motion.div>
            <p className="text-white text-lg">Loading...</p>
        </div>
    </div>
);

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
    const { roomCode, loading } = useGame();

    if (loading) {
        return <LoadingScreen />;
    }

    if (!roomCode) {
        return <Navigate to="/" replace />;
    }

    return children;
};

// Main game router
const GameRouter = () => {
    const { roomCode, isHost, gameStatus, evolutionNotification } = useGame();

    // Hàm helper để render màn hình chính
    const renderMainContent = () => {
        if (!roomCode) return <LandingPage />;
        if (gameStatus === 'FINAL_RESULTS') return <ResultsView />;
        if (isHost) return <HostDashboard />;
        return <ClientUI />;
    };

    return (
        <>
            {/* 1. Màn hình chính */}
            {renderMainContent()}

            {/* 2. Lớp phủ thông báo (Luôn nằm trên cùng bất kể là màn hình nào) */}
            {evolutionNotification && (
                <EvolutionNotification data={evolutionNotification} />
            )}
        </>
    );
};

// App component
function App() {
    return (
        <GameProvider>
            <Router>
                {/* Thêm flex-col và overflow-y-auto ở đây */}
                <div className="min-h-screen bg-gray-900 flex flex-col overflow-y-auto overflow-x-hidden">
                    <Routes>
                        <Route path="/" element={<GameRouter />} />
                        <Route path="/game/:roomCode" element={<GameRouter />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </Router>
        </GameProvider>
    );
}

export default App;

