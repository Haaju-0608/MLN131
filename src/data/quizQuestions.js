// Quiz Questions - Chapter 2: Historical Mission of the Working Class
// Educational content for the Worker 4.0 Evolution game

export const quizQuestions = [
    {
        id: 1,
        chapter: 'Chapter 2: Historical Mission of the Working Class',
        question: 'When did the Industrial Revolution begin?',
        options: [
            'Early 18th Century (1760s)',
            'Late 19th Century (1880s)',
            'Mid 20th Century (1950s)',
            'Early 21st Century (2000s)'
        ],
        correctIndex: 0,
        explanation: 'The Industrial Revolution began in Britain in the late 18th century (around 1760s) and spread to Europe and America.'
    },
    {
        id: 2,
        chapter: 'Chapter 2: Historical Mission of the Working Class',
        question: 'What was the main characteristic of manual labor in the early industrial era?',
        options: [
            'Using advanced robotics',
            'Hand tools and physical work',
            'Computer programming',
            'AI-controlled machines'
        ],
        correctIndex: 1,
        explanation: 'Manual labor in the early industrial era relied on hand tools, physical strength, and traditional craftsmanship.'
    },
    {
        id: 3,
        chapter: 'Chapter 2: Historical Mission of the Working Class',
        question: 'Which movement led to the establishment of labor unions?',
        options: [
            'The Green Revolution',
            'The Labor Movement',
            'The Digital Revolution',
            'The Renaissance'
        ],
        correctIndex: 1,
        explanation: 'The Labor Movement emerged in the 19th century to protect workers\' rights, leading to the formation of labor unions.'
    },
    {
        id: 4,
        chapter: 'Chapter 2: Historical Mission of the Working Class',
        question: 'What was a major achievement of the early labor movement?',
        options: [
            'The 8-hour workday',
            'The elimination of all jobs',
            'The end of education',
            'The removal of all technology'
        ],
        correctIndex: 0,
        explanation: 'The labor movement fought for and achieved the 8-hour workday, a significant improvement from the 12-16 hour workdays common in factories.'
    },
    {
        id: 5,
        chapter: 'Chapter 2: Historical Mission of the Working Class',
        question: 'What does "Division of Labor" mean in the context of industrialization?',
        options: [
            'Workers dividing their wages',
            'Breaking down production into simple, repeated tasks',
            'Workers taking vacations',
            'Companies splitting into smaller businesses'
        ],
        correctIndex: 1,
        explanation: 'Division of Labor means breaking down the production process into simple, specialized tasks, increasing efficiency and productivity.'
    },
    {
        id: 6,
        chapter: 'Chapter 2: Historical Mission of the Working Class',
        question: 'What characterized the mass production era (Level 2)?',
        options: [
            'Only artistic crafts',
            'Assembly lines and standardization',
            'Complete automation',
            'No workers needed'
        ],
        correctIndex: 1,
        explanation: 'The mass production era was characterized by assembly lines, standardized parts, and factory production, epitomized by Henry Ford\'s assembly line.'
    },
    {
        id: 7,
        chapter: 'Chapter 2: Historical Mission of the Working Class',
        question: 'What is the primary focus of Knowledge Workers 4.0?',
        options: [
            'Physical labor only',
            'Information technology and innovation',
            'Mining and agriculture',
            'Manual harvesting'
        ],
        correctIndex: 1,
        explanation: 'Knowledge Workers 4.0 focus on information technology, data analysis, innovation, and digital problem-solving.'
    },
    {
        id: 8,
        chapter: 'Chapter 2: Historical Mission of the Working Class',
        question: 'What technological advancement defined the transition to Knowledge Worker 4.0?',
        options: [
            'Steam engines',
            'Assembly lines',
            'Artificial Intelligence and digital technology',
            'Horse-drawn carriages'
        ],
        correctIndex: 2,
        explanation: 'The transition to Knowledge Worker 4.0 was driven by AI, digital technology, automation, and the internet revolution.'
    },
    {
        id: 9,
        chapter: 'Chapter 2: Historical Mission of the Working Class',
        question: 'What is the historical mission of the working class?',
        options: [
            'To replace all machines',
            'To drive societal progress and economic development',
            'To stop all technological advancement',
            'To eliminate all jobs'
        ],
        correctIndex: 1,
        explanation: 'The historical mission of the working class has been to drive societal progress, economic development, and continuously adapt to technological changes.'
    },
    {
        id: 10,
        chapter: 'Chapter 2: Historical Mission of the Working Class',
        question: 'How has the role of workers evolved from Level 1 to Level 3?',
        options: [
            'From physical to mental labor',
            'From simple to complex skills',
            'From manual to digital tools',
            'All of the above'
        ],
        correctIndex: 3,
        explanation: 'Workers have evolved from physical labor (Level 1) to using machines (Level 2) to leveraging digital tools and AI (Level 3).'
    },
    {
        id: 11,
        chapter: 'Chapter 2: Historical Mission of the Working Class',
        question: 'What is "Upskilling" in the context of Worker 4.0?',
        options: [
            'Working longer hours',
            'Learning new digital and technical skills',
            'Doing only manual work',
            'Reducing work efficiency'
        ],
        correctIndex: 1,
        explanation: 'Upskilling refers to acquiring new digital and technical skills to adapt to the evolving workplace and technological advancements.'
    },
    {
        id: 12,
        chapter: 'Chapter 2: Historical Mission of the Working Class',
        question: 'What is the significance of "Continuous Learning" for modern workers?',
        options: [
            'It is no longer important',
            'Essential for staying relevant in a changing economy',
            'Only for older workers',
            'Only for managers'
        ],
        correctIndex: 1,
        explanation: 'Continuous learning is essential for modern workers to stay relevant, adapt to new technologies, and advance their careers.'
    }
];

// Get random questions for a round
export const getRandomQuestions = (count = 5) => {
    const shuffled = [...quizQuestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

// Get question by ID
export const getQuestionById = (id) => {
    return quizQuestions.find(q => q.id === id);
};

export default quizQuestions;

