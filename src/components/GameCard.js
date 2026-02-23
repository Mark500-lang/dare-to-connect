import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import gamesService from '../services/gameService';
import { Box, CircularProgress, Alert } from '@mui/material';
import { IoIosArrowBack } from "react-icons/io";
import { IoArrowBackCircle, IoArrowForwardCircle } from "react-icons/io5";
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
            
            // Save progress
            const newProgress = {
                currentIndex: newIndex,
                answered: [...progress.answered, currentQuestionIndex]
            };
            setProgress(newProgress);
            localStorage.setItem(`game_${gameId}_progress`, JSON.stringify(newProgress));
            
            // Trigger card animation
            if (cardStackRef.current) {
                const currentCard = cardStackRef.current.querySelector('.current-card');
                if (currentCard) {
                    currentCard.classList.add('card-slide-out-right');
                    
                    setTimeout(() => {
                        // Update index after animation
                        setCurrentQuestionIndex(newIndex);
                        
                        // Remove animation class for next animation
                        setTimeout(() => {
                            if (currentCard) {
                                currentCard.classList.remove('card-slide-out-right');
                            }
                        }, 50);
                    }, 300);
                } else {
                    setCurrentQuestionIndex(newIndex);
                }
            } else {
                setCurrentQuestionIndex(newIndex);
            }
        } else {
            // Game completed - clear progress
            localStorage.removeItem(`game_${gameId}_progress`);
            navigate(`/games/${gameId}`);
        }
    };

    const handlePrevCard = () => {
        if (currentQuestionIndex > 0) {
            const newIndex = currentQuestionIndex - 1;
            
            // Trigger card animation
            if (cardStackRef.current) {
                const currentCard = cardStackRef.current.querySelector('.current-card');
                if (currentCard) {
                    currentCard.classList.add('card-slide-out-left');
                    
                    setTimeout(() => {
                        // Update index after animation
                        setCurrentQuestionIndex(newIndex);
                        
                        // Remove animation class for next animation
                        setTimeout(() => {
                            if (currentCard) {
                                currentCard.classList.remove('card-slide-out-left');
                            }
                        }, 50);
                    }, 300);
                } else {
                    setCurrentQuestionIndex(newIndex);
                }
            } else {
                setCurrentQuestionIndex(newIndex);
            }
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
        
        // Show only current card
        stack.push({ 
            index: currentIndex, 
            isCurrent: true,
            zIndex: 3,
            rotation: 0,
            translateY: 0
        });
        
        // Show next card behind if exists
        if (currentIndex < totalQuestions - 1) {
            stack.unshift({ 
                index: currentIndex + 1, 
                isCurrent: false,
                zIndex: 2,
                rotation: 3,
                translateY: 15
            });
        }
        
        // Show previous card behind if exists
        if (currentIndex > 0) {
            stack.unshift({ 
                index: currentIndex - 1, 
                isCurrent: false,
                zIndex: 1,
                rotation: -3,
                translateY: 30
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
        const isFirstQuestion = currentQuestionIndex === 0;

        return (
            <>
                {/* Main Content Container */}
                <div className="centered-content">
                    {/* Card and Navigation Container */}
                    <div className="card-nav-container">
                        {/* Left Navigation Button */}
                        <button 
                            className="nav-button"
                            onClick={handlePrevCard}
                            disabled={isFirstQuestion}
                            aria-label="Previous card"
                            style={{ 
                                color: game.color || '#FF6B6B',
                                opacity: isFirstQuestion ? 0.3 : 1
                            }}
                        >
                            <IoArrowBackCircle size="100%" />
                        </button>

                        {/* Card Stack Container */}
                        <div className="card-stack-wrapper" ref={cardStackRef}>
                            <div className="card-stack-container">
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
                                                {/* {card.isCurrent && (
                                                    <div className="card-progress">
                                                        <span className="card-counter">
                                                            {currentQuestionIndex + 1} / {questions.length}
                                                        </span>
                                                    </div>
                                                )} */}
                                            </div>
                                            {!card.isCurrent && (
                                                <div className="card-shadow"></div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            
                        </div>

                        {/* Right Navigation Button */}
                        <button 
                            className="nav-button"
                            onClick={handleNextCard}
                            disabled={isLastQuestion}
                            aria-label="Next card"
                            style={{ 
                                color: game.color || '#FF6B6B',
                                opacity: isLastQuestion ? 0.3 : 1
                            }}
                        >
                            <IoArrowForwardCircle size="100%" />
                        </button>
                    </div>

                    {/* Shuffle Button Container */}
                    <div className="shuffle-container">
                        <button 
                            className="control-btn shuffle-btn"
                            onClick={handleShuffle}
                            style={{ 
                                backgroundColor: game.color || '#FF6B6B',
                                color: '#ffffff'
                            }}
                        >
                            SHUFFLE CARDS
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className='promo-footer'>
                    <a className='site-link' target='_blank' rel='noopener noreferrer' href='https://daretoconnectgames.com/'>
                        www.daretoconnectgames.com
                    </a>
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