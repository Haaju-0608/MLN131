// Evolution Logic for Worker 4.0 Evolution Game
// Manages player avatar evolution based on points

// Level Definitions
export const LEVELS = {
    LEVEL_1: {
        id: 1,
        name: 'Manual Worker',
        minPoints: 0,
        maxPoints: 2000,
        avatar: '👨‍🔧',
        title: 'Manual Worker',
        description: 'Early Industrial Stage - Hard work and determination',
        color: '#F59E0B',
        glowColor: 'rgba(245, 158, 11, 0.5)',
    },
    LEVEL_2: {
        id: 2,
        name: 'Mechanical Worker',
        minPoints: 2001,
        maxPoints: 6000, // Tăng nhẹ mốc này để Level 3 thực sự là một "đặc ân"
        avatar: '👷‍♂️',
        title: 'Mechanical Worker',
        description: 'Mass Production Era - Efficiency and skill',
        color: '#10B981',
        glowColor: 'rgba(16, 185, 129, 0.5)',
    },
    LEVEL_3: {
        id: 3,
        name: 'Knowledge Worker 4.0',
        minPoints: 6001,
        maxPoints: Infinity,
        avatar: '🤖', // Để 1 emoji cho sạch giao diện, hoặc '🤖👨‍💻' nếu bạn thích
        title: 'Knowledge Worker 4.0',
        description: 'Digital/AI Era - Innovation and intelligence',
        color: '#3B82F6',
        glowColor: 'rgba(59, 130, 246, 0.5)',
    },
};

// Get level based on points
export const getLevelByPoints = (points) => {
    if (points <= LEVELS.LEVEL_1.maxPoints) return LEVELS.LEVEL_1;
    if (points <= LEVELS.LEVEL_2.maxPoints) return LEVELS.LEVEL_2;
    return LEVELS.LEVEL_3;
};

// Get level by level number
export const getLevelByNumber = (levelNumber) => {
    switch (levelNumber) {
        case 1:
            return LEVELS.LEVEL_1;
        case 2:
            return LEVELS.LEVEL_2;
        case 3:
            return LEVELS.LEVEL_3;
        default:
            return LEVELS.LEVEL_1;
    }
};

// Calculate points needed for next level
export const getPointsForNextLevel = (currentPoints) => {
    if (currentPoints <= 2000) {
        return { nextLevel: 2, pointsNeeded: 2001 - currentPoints };
    } else if (currentPoints <= 5000) {
        return { nextLevel: 3, pointsNeeded: 5001 - currentPoints };
    } else {
        return { nextLevel: null, pointsNeeded: 0 };
    }
};

// Check if player should level up
export const checkLevelUp = (oldPoints, newPoints) => {
    const oldLevel = getLevelByPoints(oldPoints);
    const newLevel = getLevelByPoints(newPoints);

    if (newLevel.id > oldLevel.id) {
        return {
            leveledUp: true,
            oldLevel: oldLevel,
            newLevel: newLevel,
        };
    }

    return {
        leveledUp: false,
        oldLevel: oldLevel,
        newLevel: newLevel,
    };
};

// Calculate quiz score based on time
// Formula: Points = (RemainingTime / TotalTime) * 1000
export const calculateQuizScore = (remainingTime, totalTime = 30) => {
    const time = parseFloat(remainingTime);
    const total = parseFloat(totalTime);

    if (isNaN(time) || time <= 0) return 100;

    // Tính điểm dựa trên tốc độ (Ví dụ: còn 30s được 1000đ, còn 1s được ~133đ)
    // Thêm hệ số làm tròn đẹp (bội số của 10)
    const score = Math.round(((time / total) * 900) + 100);

    return Math.min(Math.max(score, 100), 1000);
};

// Add points with level cap
export const addPoints = (currentPoints, pointsToAdd) => {
    const newPoints = currentPoints + pointsToAdd;
    return Math.min(newPoints, 99999); // Cap at reasonable max
};

// Get progress percentage to next level
export const getLevelProgress = (points) => {
    if (points <= LEVELS.LEVEL_1.maxPoints) {
        return {
            currentLevel: 1,
            progress: Math.min((points / LEVELS.LEVEL_1.maxPoints) * 100, 100),
            nextLevelPoints: LEVELS.LEVEL_1.maxPoints + 1,
        };
    } else if (points <= LEVELS.LEVEL_2.maxPoints) {
        const range = LEVELS.LEVEL_2.maxPoints - LEVELS.LEVEL_2.minPoints;
        const currentProgress = points - LEVELS.LEVEL_2.minPoints;
        return {
            currentLevel: 2,
            progress: Math.min((currentProgress / range) * 100, 100),
            nextLevelPoints: LEVELS.LEVEL_2.maxPoints + 1,
        };
    } else {
        return {
            currentLevel: 3,
            progress: 100,
            nextLevelPoints: null,
        };
    }
};

// Background images for each level (URLs or CSS classes)
export const LEVEL_BACKGROUNDS = {
    1: {
        name: 'Dark Factory',
        description: 'The manual labor era',
        cssClass: 'bg-level-1',
    },
    2: {
        name: 'Modern Assembly Line',
        description: 'The age of mass production',
        cssClass: 'bg-level-2',
    },
    3: {
        name: 'High-tech Lab',
        description: 'The digital/AI revolution',
        cssClass: 'bg-level-3',
    },
};

// Get background for level
export const getBackgroundForLevel = (level) => {
    return LEVEL_BACKGROUNDS[level] || LEVEL_BACKGROUNDS[1];
};

export default {
    LEVELS,
    getLevelByPoints,
    getLevelByNumber,
    getPointsForNextLevel,
    checkLevelUp,
    calculateQuizScore,
    addPoints,
    getLevelProgress,
    getBackgroundForLevel,
};

