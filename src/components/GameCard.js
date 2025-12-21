import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import gamesService from '../services/gameService';
import { Box, CircularProgress, Alert } from '@mui/material';
import { IoIosArrowBack } from "react-icons/io";
import { IoArrowBackCircle } from "react-icons/io5";
import { TbCards } from "react-icons/tb";
import './GameCard.css';

const GameCard = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const { subscription } = useAuth();
    
    const [game, setGame] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isShuffled, setIsShuffled] = useState(false);
    const [progress, setProgress] = useState(() => {
        // Load progress from localStorage
        const saved = localStorage.getItem(`game_${gameId}_progress`);
        return saved ? JSON.parse(saved) : { currentIndex: 0, answered: [] };
    });
    
    const cardStackRef = useRef(null);

    useEffect(() => {
        loadGameData();
        
        // Load saved progress
        const saved = localStorage.getItem(`game_${gameId}_progress`);
        if (saved) {
            const parsed = JSON.parse(saved);
            setCurrentQuestionIndex(parsed.currentIndex || 0);
        }
    }, [gameId]);

    const loadGameData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Get game from cache or API
            const gameData = gamesService.getGameById(gameId);
            
            if (!gameData) {
                // Game not in cache, need to fetch all games
                await gamesService.getAllGames();
                const foundGame = gamesService.getGameById(gameId);
                
                if (!foundGame) {
                    throw new Error('Game not found');
                }
                
                setGame(foundGame);
            } else {
                setGame(gameData);
            }
            
            // Load questions
            const questionsData = await gamesService.getGameQuestions(gameId);
            setQuestions(questionsData);
            
            // Initialize with original order
            if (!isShuffled) {
                setQuestions(questionsData);
            }
            
        } catch (err) {
            console.error('Error loading game:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleNextCard = () => {
        if (currentQuestionIndex < questions.length - 1) {
            const newIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(newIndex);
            
            // Save progress
            const newProgress = {
                currentIndex: newIndex,
                answered: [...progress.answered, currentQuestionIndex]
            };
            setProgress(newProgress);
            localStorage.setItem(`game_${gameId}_progress`, JSON.stringify(newProgress));
            
            // Trigger card animation
            if (cardStackRef.current) {
                cardStackRef.current.classList.add('card-slide-out');
                setTimeout(() => {
                    if (cardStackRef.current) {
                        cardStackRef.current.classList.remove('card-slide-out');
                    }
                }, 300);
            }
        } else {
            // Game completed - clear progress
            localStorage.removeItem(`game_${gameId}_progress`);
            navigate(`/games/${gameId}`);
        }
    };

    const handlePrevCard = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleBack = () => {
        navigate(`/games/${gameId}`);
    };

    const handleShuffle = () => {
        if (questions.length > 0) {
            const shuffled = [...questions].sort(() => Math.random() - 0.5);
            setQuestions(shuffled);
            setCurrentQuestionIndex(0);
            setIsShuffled(true);
            
            // Clear progress on shuffle
            localStorage.removeItem(`game_${gameId}_progress`);
            setProgress({ currentIndex: 0, answered: [] });
        }
    };

    const getCardStack = () => {
        const stack = [];
        const totalQuestions = questions.length;
        const currentIndex = currentQuestionIndex;
        
        // Always show at least one card
        if (totalQuestions === 0) return [];
        
        // For first card, show next card underneath
        if (currentIndex === 0 && totalQuestions > 1) {
            stack.push({ 
                index: currentIndex, 
                isCurrent: true,
                zIndex: 3,
                rotation: 0,
                translateY: 0
            });
            stack.push({ 
                index: currentIndex + 1, 
                isCurrent: false,
                zIndex: 2,
                rotation: 3,
                translateY: 10
            });
        }
        // For last card, show previous card underneath
        else if (currentIndex === totalQuestions - 1 && totalQuestions > 1) {
            stack.push({ 
                index: currentIndex - 1, 
                isCurrent: false,
                zIndex: 2,
                rotation: -3,
                translateY: 10
            });
            stack.push({ 
                index: currentIndex, 
                isCurrent: true,
                zIndex: 3,
                rotation: 0,
                translateY: 0
            });
        }
        // For middle cards, show both previous and next
        else if (totalQuestions > 2) {
            stack.push({ 
                index: currentIndex - 1, 
                isCurrent: false,
                zIndex: 1,
                rotation: -2,
                translateY: 20
            });
            stack.push({ 
                index: currentIndex, 
                isCurrent: true,
                zIndex: 3,
                rotation: 0,
                translateY: 0
            });
            stack.push({ 
                index: currentIndex + 1, 
                isCurrent: false,
                zIndex: 2,
                rotation: 2,
                translateY: 10
            });
        }
        // For two cards only
        else if (totalQuestions === 2) {
            if (currentIndex === 0) {
                stack.push({ 
                    index: currentIndex, 
                    isCurrent: true,
                    zIndex: 3,
                    rotation: 0,
                    translateY: 0
                });
                stack.push({ 
                    index: 1, 
                    isCurrent: false,
                    zIndex: 2,
                    rotation: 3,
                    translateY: 10
                });
            } else {
                stack.push({ 
                    index: 0, 
                    isCurrent: false,
                    zIndex: 2,
                    rotation: -3,
                    translateY: 10
                });
                stack.push({ 
                    index: currentIndex, 
                    isCurrent: true,
                    zIndex: 3,
                    rotation: 0,
                    translateY: 0
                });
            }
        }
        // Single card
        else {
            stack.push({ 
                index: currentIndex, 
                isCurrent: true,
                zIndex: 3,
                rotation: 0,
                translateY: 0
            });
        }
        
        return stack;
    };

    const renderContent = () => {
        if (loading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                </Box>
            );
        }

        if (error) {
            return (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                </Box>
            );
        }

        if (!game || questions.length === 0) {
            return (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Alert severity="info">
                        No questions available for this game
                    </Alert>
                </Box>
            );
        }

        const cardStack = getCardStack();
        const currentQuestion = questions[currentQuestionIndex];
        const isLastQuestion = currentQuestionIndex === questions.length - 1;

        return (
            <>
                {/* Card Stack */}
                <div className="card-stack-container" ref={cardStackRef}>
                    {cardStack.map((card, i) => {
                        const question = questions[card.index];
                        if (!question) return null;
                        
                        return (
                            <div
                                key={`${card.index}-${i}`}
                                className={`stacked-card ${card.isCurrent ? 'current-card' : ''}`}
                                style={{
                                    zIndex: card.zIndex,
                                    transform: `rotate(${card.rotation}deg) translateY(${card.translateY}px)`,
                                    backgroundColor: game.color || '#FF6B6B',
                                    transition: card.isCurrent ? 'transform 0.3s ease' : 'none'
                                }}
                            >
                                <div className="card-content">
                                    <h3 className="card-text">{question.question}</h3>
                                    {card.isCurrent && (
                                        <div className="card-progress">
                                            <span className="card-counter">
                                                {currentQuestionIndex + 1} / {questions.length}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {!card.isCurrent && (
                                    <div className="card-shadow"></div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Navigation Controls */}
                <div className="card-navigation">
                    <button 
                        className="nav-button prev-button"
                        onClick={handlePrevCard}
                        disabled={currentQuestionIndex === 0}
                        aria-label="Previous card"
                        style={{ 
                            color: game.color || '#FF6B6B',
                            opacity: currentQuestionIndex === 0 ? 0.3 : 1
                        }}
                    >
                        <IoArrowBackCircle size={40} />
                    </button>
                    
                    <button 
                        className="nav-button next-button"
                        onClick={handleNextCard}
                        disabled={isLastQuestion}
                        aria-label="Next card"
                        style={{ 
                            color: game.color || '#FF6B6B',
                            transform: 'rotate(180deg)',
                            opacity: isLastQuestion ? 0.3 : 1
                        }}
                    >
                        <IoArrowBackCircle size={40} />
                    </button>
                </div>

                {/* Controls */}
                <div className="game-controls">
                    <button 
                        className="control-btn shuffle-btn"
                        onClick={handleShuffle}
                        style={{ 
                            backgroundColor: game.color || '#FF6B6B',
                            color: '#ffffff'
                        }}
                    >
                        <TbCards size={20} style={{ marginRight: '8px' }} />
                        SHUFFLE CARDS
                    </button>
                </div>
            </>
        );
    };

    return (
        <div className="game-card-container">
            {/* Header */}
            <div className="game-card-header">
                <IoIosArrowBack 
                    className="back-button" 
                    onClick={handleBack} 
                    aria-label="Go back" 
                    size={24} 
                    color="#000000ff" 
                />
                <h1 className='game-card-title'>{game?.gameName || 'Game Cards'}</h1>
            </div>
            
            <div className='game-card-content'>
                {renderContent()}
            </div>
        </div>
    );
};

export default GameCard;