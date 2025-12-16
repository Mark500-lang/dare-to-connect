
import freeTrialImg from '../assets/Screen 2/Free trial.png';
import freeTrialImg2 from '../assets/Screen 4/Cards - Dare to connect.png';
import DeeperConnectionImg from '../assets/Screen 2/Game - Deeper Connection.png';
import DeeperConnectionImg2 from '../assets/Screen 4/Cards - Deeper Connections.png';
import TalkingStageImg from '../assets/Screen 2/Game - Talking Stage.png';
import TalkingStageImg2 from '../assets/Screen 4/Cards - Talking Stage.png';
import CouplesTherapyImg from '../assets/Screen 2/Game - Couples Therapy.png';
import CouplesTherapyImg2 from '../assets/Screen 4/Cards - Talking Stage.png';
import TeenAffirmationsImg from '../assets/Screen 2/Game - Teen Affirmations.png';
import TeenAffirmationsImg2 from '../assets/Screen 4/Cards - Teen Affirmation.png';
import LadiesAffirmationsImg from '../assets/Screen 2/Game - Ladies Affirmations.png';
import LadiesAffirmationsImg2 from '../assets/Screen 4/Cards - Ladies Affirmation.png';
import SobrietyAffirmationsImg from '../assets/Screen 2/Game - Sobriety affirmations.png';
import SobrietyAffirmationsImg2 from '../assets/Screen 4/Cards - Sobriety Affirmation.png';
import CabinCrewInterviewImg from '../assets/Screen 2/Game - Cabin Crew.png';
import CabinCrewInterviewImg2 from '../assets/Screen 4/Cards - Cabin Crew.png';
import JobInterviewImg from '../assets/Screen 2/Game - job interview.png';
import JobInterviewImg2 from '../assets/Screen 4/Cards - Job interview.png';

const gamesData = [
    {
        id: 1,
        title: 'Chilling With Friends',
        shortTitle: 'Chilling',
        category: 'Free Trial',
        type: 'icebreaker',
        color: '#1674A2', // Coral Red
        backgroundColor: '#1674A2',
        image: freeTrialImg,
        cardImage: freeTrialImg2,
        description: 'Break the ice and have fun with friends through engaging conversation starters.',
        detailedDescription: 'Perfect for new friends or old groups looking to reconnect. This game features light-hearted questions that encourage sharing and laughter.',
        duration: '15-30 minutes',
        players: '2-8 players',
        difficulty: 'Easy',
        rating: 4.8,
        price: 'Free',
        tags: ['social', 'friends', 'icebreaker', 'casual'],
        instructions: [
            'Gather your friends in a comfortable setting',
            'Take turns drawing cards',
            'Answer the question on your card honestly',
            'Listen actively to others',
            'Have fun and be respectful'
        ],
        cards: [
            { id: 1, text: "What's your most embarrassing childhood memory?", color: '#FF6B6B' },
            { id: 2, text: "If you could have any superpower, what would it be and why?", color: '#FF6B6B' },
            { id: 3, text: "What's the most adventurous thing you've ever done?", color: '#FF6B6B' },
            { id: 4, text: "Share your go-to karaoke song", color: '#FF6B6B' },
            { id: 5, text: "What's your hidden talent?", color: '#FF6B6B' }
        ]
    },
    {
        id: 2,
        title: 'Deeper Connections',
        shortTitle: 'Deeper',
        category: 'Paid',
        type: 'relationships',
        color: '#00363D', // Tiffany Blue
        backgroundColor: '#00363D',
        image: DeeperConnectionImg,
        cardImage: DeeperConnectionImg2,
        description: 'Build meaningful connections through thoughtful and profound questions.',
        detailedDescription: 'Designed for friends, partners, or family members who want to strengthen their bonds. These questions go beyond surface level to explore values, dreams, and emotions.',
        duration: '30-45 minutes',
        players: '2-6 players',
        difficulty: 'Medium',
        rating: 4.9,
        price: '$4.99',
        tags: ['deep', 'emotional', 'relationships', 'meaningful'],
        instructions: [
            'Create a safe and comfortable environment',
            'Take your time with each question',
            'Be honest and vulnerable',
            'Practice active listening',
            'Respect boundaries and privacy'
        ],
        cards: [
            { id: 1, text: "What does unconditional love mean to you?", color: '#4ECDC4' },
            { id: 2, text: "What's one fear you've overcome that shaped who you are?", color: '#4ECDC4' },
            { id: 3, text: "What legacy do you want to leave behind?", color: '#4ECDC4' },
            { id: 4, text: "Describe a moment that changed your perspective on life", color: '#4ECDC4' },
            { id: 5, text: "What does true happiness look like to you?", color: '#4ECDC4' }
        ]
    },
    {
        id: 3,
        title: 'Talking Stage',
        shortTitle: 'Talking',
        category: 'Paid',
        type: 'dating',
        color: '#CA2279', // Emerald Green
        backgroundColor: '#CA2279',
        image: TalkingStageImg,
        cardImage: TalkingStageImg2,
        description: 'Navigate the early stages of dating with conversation starters designed for new connections.',
        detailedDescription: 'Perfect for people in the talking stage or early dating phase. These questions help you learn about each other while keeping things light and interesting.',
        duration: '20-40 minutes',
        players: '2 players',
        difficulty: 'Easy',
        rating: 4.7,
        price: '$3.99',
        tags: ['dating', 'romantic', 'new relationships', 'conversation'],
        instructions: [
            'Choose a relaxed setting',
            'Take turns asking questions',
            'Be genuine in your answers',
            'Keep the conversation flowing naturally',
            'Respect each other\'s comfort levels'
        ],
        cards: [
            { id: 1, text: "What's your idea of a perfect date?", color: '#06D6A0' },
            { id: 2, text: "What qualities are most important to you in a partner?", color: '#06D6A0' },
            { id: 3, text: "Share something you're passionate about", color: '#06D6A0' },
            { id: 4, text: "What's your love language?", color: '#06D6A0' },
            { id: 5, text: "Describe your ideal weekend", color: '#06D6A0' }
        ]
    },
    {
        id: 4,
        title: 'Couples Therapy',
        shortTitle: 'Couples',
        category: 'Paid',
        type: 'relationships',
        color: '#2FB3DE', // Ocean Blue
        backgroundColor: '#2FB3DE',
        image: CouplesTherapyImg,
        cardImage: CouplesTherapyImg2,
        description: 'Strengthen your relationship through guided conversations and connection exercises.',
        detailedDescription: 'Created with relationship experts, this game helps couples communicate better, understand each other deeply, and strengthen their bond through meaningful interaction.',
        duration: '45-60 minutes',
        players: '2 players',
        difficulty: 'Medium',
        rating: 4.9,
        price: '$5.99',
        tags: ['couples', 'therapy', 'communication', 'relationship'],
        instructions: [
            'Set aside uninterrupted time',
            'Create a judgment-free zone',
            'Practice active listening',
            'Use "I feel" statements',
            'Take breaks if needed'
        ],
        cards: [
            { id: 1, text: "What's one thing I do that makes you feel loved?", color: '#118AB2' },
            { id: 2, text: "How can we better support each other's dreams?", color: '#118AB2' },
            { id: 3, text: "What's a challenge we've overcome together that made us stronger?", color: '#118AB2' },
            { id: 4, text: "How do you prefer to receive affection?", color: '#118AB2' },
            { id: 5, text: "What's your favorite memory of us?", color: '#118AB2' }
        ]
    },
    {
        id: 5,
        title: 'Teen Affirmations',
        shortTitle: 'Teen',
        category: 'Paid',
        type: 'self-care',
        color: '#A5C66D', // Pink
        backgroundColor: '#A5C66D',
        image: TeenAffirmationsImg,
        cardImage: TeenAffirmationsImg2,
        description: 'Positive affirmations and confidence-building exercises designed for teenagers.',
        detailedDescription: 'Help teens build self-esteem, manage stress, and develop positive thinking patterns through daily affirmations and guided reflection.',
        duration: '10-20 minutes daily',
        players: '1 player',
        difficulty: 'Easy',
        rating: 4.8,
        price: '$2.99',
        tags: ['teen', 'affirmations', 'self-esteem', 'mental-health'],
        instructions: [
            'Find a quiet space',
            'Read affirmations aloud',
            'Reflect on their meaning',
            'Practice daily',
            'Journal your thoughts if desired'
        ],
        cards: [
            { id: 1, text: "I am enough just as I am", color: '#EF476F' },
            { id: 2, text: "My feelings are valid and important", color: '#EF476F' },
            { id: 3, text: "I am capable of achieving my goals", color: '#EF476F' },
            { id: 4, text: "I choose to focus on what I can control", color: '#EF476F' },
            { id: 5, text: "I am growing and learning every day", color: '#EF476F' }
        ]
    },
    {
        id: 6,
        title: 'Ladies Affirmations',
        shortTitle: 'Ladies',
        category: 'Paid',
        type: 'self-care',
        color: '#DEB53F', // Purple
        backgroundColor: '#DEB53F',
        image: LadiesAffirmationsImg,
        cardImage: LadiesAffirmationsImg2,
        description: 'Empowering affirmations and self-love practices for women of all ages.',
        detailedDescription: 'A collection of powerful affirmations designed to boost confidence, promote self-love, and empower women in their personal and professional lives.',
        duration: '10-15 minutes daily',
        players: '1 player',
        difficulty: 'Easy',
        rating: 4.9,
        price: '$2.99',
        tags: ['women', 'empowerment', 'self-love', 'confidence'],
        instructions: [
            'Create a daily routine',
            'Speak affirmations with conviction',
            'Visualize their truth',
            'Repeat throughout the day',
            'Share with other women'
        ],
        cards: [
            { id: 1, text: "I am strong, capable, and worthy", color: '#9D4EDD' },
            { id: 2, text: "I trust my intuition and wisdom", color: '#9D4EDD' },
            { id: 3, text: "I celebrate my unique qualities", color: '#9D4EDD' },
            { id: 4, text: "I set healthy boundaries with love", color: '#9D4EDD' },
            { id: 5, text: "I am creating the life I deserve", color: '#9D4EDD' }
        ]
    },
    {
        id: 7,
        title: 'Sobriety Affirmations',
        shortTitle: 'Sobriety',
        category: 'Paid',
        type: 'health',
        color: '#AC733B', // Teal
        backgroundColor: '#AC733B',
        image: SobrietyAffirmationsImg,
        cardImage: SobrietyAffirmationsImg2,
        description: 'Supportive affirmations for those on a sobriety or recovery journey.',
        detailedDescription: 'Daily affirmations and reflections designed to support individuals in recovery, promote mindfulness, and reinforce positive choices.',
        duration: '5-15 minutes daily',
        players: '1 player',
        difficulty: 'Medium',
        rating: 5.0,
        price: '$3.99',
        tags: ['sobriety', 'recovery', 'mental-health', 'wellness'],
        instructions: [
            'Use daily as part of your routine',
            'Read when feeling challenged',
            'Reflect on your progress',
            'Share with support system',
            'Celebrate milestones'
        ],
        cards: [
            { id: 1, text: "I choose health and clarity today", color: '#2A9D8F' },
            { id: 2, text: "I am stronger than my cravings", color: '#2A9D8F' },
            { id: 3, text: "Each day sober is a victory", color: '#2A9D8F' },
            { id: 4, text: "I deserve a healthy, happy life", color: '#2A9D8F' },
            { id: 5, text: "My journey is unique and valid", color: '#2A9D8F' }
        ]
    },
    {
        id: 8,
        title: 'Cabin Crew Interview',
        shortTitle: 'Cabin Crew',
        category: 'Paid',
        type: 'career',
        color: '#D51C54', // Coral Orange
        backgroundColor: '#D51C54',
        image: CabinCrewInterviewImg,
        cardImage: CabinCrewInterviewImg2,
        description: 'Practice questions and tips for aspiring cabin crew members.',
        detailedDescription: 'Comprehensive preparation tool for cabin crew interviews with common questions, scenario-based exercises, and expert tips for success.',
        duration: '30-60 minutes',
        players: '1 player',
        difficulty: 'Hard',
        rating: 4.8,
        price: '$6.99',
        tags: ['interview', 'aviation', 'career', 'preparation'],
        instructions: [
            'Practice regularly',
            'Record yourself answering',
            'Time your responses',
            'Research airline specifics',
            'Practice with a partner'
        ],
        cards: [
            { id: 1, text: "Why do you want to be cabin crew?", color: '#E76F51' },
            { id: 2, text: "How would you handle a difficult passenger?", color: '#E76F51' },
            { id: 3, text: "Describe excellent customer service", color: '#E76F51' },
            { id: 4, text: "What's your understanding of safety procedures?", color: '#E76F51' },
            { id: 5, text: "How do you work in a team?", color: '#E76F51' }
        ]
    },
    {
        id: 9,
        title: 'Job Interview',
        shortTitle: 'Job Interview',
        category: 'Paid',
        type: 'career',
        color: '#382F80', // Dark Blue
        backgroundColor: '#382F80',
        image: JobInterviewImg,
        cardImage: JobInterviewImg2,
        description: 'Master your next job interview with practice questions and techniques.',
        detailedDescription: 'Essential preparation for any job seeker. Includes common interview questions, behavioral questions, and strategies to make a great impression.',
        duration: '30-90 minutes',
        players: '1 player',
        difficulty: 'Medium',
        rating: 4.7,
        price: '$5.99',
        tags: ['interview', 'career', 'job-search', 'professional'],
        instructions: [
            'Research the company',
            'Prepare STAR method answers',
            'Practice aloud',
            'Dress professionally for practice',
            'Get feedback from others'
        ],
        cards: [
            { id: 1, text: "Tell me about yourself", color: '#264653' },
            { id: 2, text: "What's your greatest strength?", color: '#264653' },
            { id: 3, text: "Describe a challenging work situation", color: '#264653' },
            { id: 4, text: "Why should we hire you?", color: '#264653' },
            { id: 5, text: "Where do you see yourself in 5 years?", color: '#264653' }
        ]
    }
];

export default gamesData;

// Helper function to get game by ID
export const getGameById = (id) => {
    return gamesData.find(game => game.id === parseInt(id)) || gamesData[0];
};

// Helper function to get games by category
export const getGamesByCategory = (category) => {
    return gamesData.filter(game => game.category === category);
};

// Helper function to get games by type
export const getGamesByType = (type) => {
    return gamesData.filter(game => game.type === type);
};