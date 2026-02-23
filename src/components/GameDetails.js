import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import gamesService from '../services/gameService';
import { Box, CircularProgress } from '@mui/material';
import { IoIosArrowBack } from "react-icons/io";
import './GameDetails.css';

// Image cache for game details
const gameImageCache = new Map();

const GameDetails = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasProgress, setHasProgress] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        loadGameDetails();
        checkProgress();
    }, [gameId]);

    const loadGameDetails = async () => {
        setLoading(true);
        setImageLoading(true);
        setImageError(false);
        
        try {
            // Get game from cache or API
            const gameData = gamesService.getGameById(gameId);
            
            if (!gameData) {
                // Game not in cache, need to fetch all games
                await gamesService.getAllGames();
                const foundGame = gamesService.getGameById(gameId);
                
                if (!foundGame) {
                    navigate('/library');
                    return;
                }
                
                setGame(foundGame);
            } else {
                setGame(gameData);
            }
        } catch (err) {
            console.error('Error loading game:', err);
            navigate('/library');
        } finally {
            setLoading(false);
        }
    };

    const preloadImage = () => {
        if (!game) return;
        
        const imageUrl = game.image2 || game.image1;
        
        // Check cache first
        if (gameImageCache.has(imageUrl)) {
            setImageLoading(false);
            return;
        }

        const img = new Image();
        img.onload = () => {
            // Cache the image URL
            gameImageCache.set(imageUrl, true);
            setImageLoading(false);
            setImageError(false);
        };
        img.onerror = () => {
            console.warn(`Failed to load image for game ${gameId}`);
            setImageLoading(false);
            setImageError(true);
        };
        img.src = imageUrl;
    };

    useEffect(() => {
        if (game) {
            preloadImage();
        }
    }, [game]);

    const checkProgress = () => {
        const saved = localStorage.getItem(`game_${gameId}_progress`);
        if (saved) {
            const progress = JSON.parse(saved);
            setHasProgress(progress.currentIndex > 0 || progress.answered.length > 0);
        }
    };

    const handleBack = () => {
        navigate('/library');
    };

    const handleStartNew = () => {
        // Check authentication for non-free games
        if (gameId !== "1" && !isAuthenticated) {
            navigate('/register');
            return;
        }
        
        // Clear any existing progress
        localStorage.removeItem(`game_${gameId}_progress`);
        navigate(`/card/${gameId}`);
    };

    const handleContinue = () => {
        // Check authentication for non-free games
        if (gameId !== "1" && !isAuthenticated) {
            navigate('/register');
            return;
        }
        
        // Navigate to continue from saved progress
        navigate(`/card/${gameId}`);
    };

    const handleImageError = (e) => {
        setImageError(true);
        e.target.style.display = 'none';
        const parent = e.target.parentElement;
        
        // Create fallback if it doesn't exist
        let fallback = parent.querySelector('.game-fallback-large');
        if (!fallback) {
            fallback = document.createElement('div');
            fallback.className = 'game-fallback-large';
            fallback.style.backgroundColor = game?.color || '#1674a2';
            fallback.innerHTML = `<h2>${game?.gameName || 'Game'}</h2>`;
            parent.appendChild(fallback);
        }
        
        fallback.style.display = 'flex';
    };

    const handleImageLoad = () => {
        setImageLoading(false);
        setImageError(false);
    };

    const renderContent = () => {
        if (loading || !game) {
            return (
                <Box className="loading-container">
                    <CircularProgress />
                </Box>
            );
        }

        return (
            <div className="game-details-content">
                <div className="game-image-container">
                    {/* Pulsing Skeleton */}
                    {imageLoading && !imageError && (
                        <div className="game-image-skeleton"></div>
                    )}
                    
                    {/* Game Image - hidden until loaded */}
                    {!imageError && (
                        <img 
                            src={game.image2 || game.image1} 
                            alt={game.gameName} 
                            className={`game-main-image ${!imageLoading ? 'loaded' : ''}`}
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                            style={{ display: imageLoading ? 'none' : 'block' }}
                        />
                    )}
                    
                    {/* Fallback Container */}
                    <div className="fallback-container">
                        {imageError && (
                            <div 
                                className="game-fallback-large"
                                style={{ 
                                    backgroundColor: game.color || '#1674a2',
                                    display: 'flex'
                                }}
                            >
                                <h2>{game.gameName}</h2>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="game-action-buttons">
                    <button 
                        className="start-continue-btn"
                        onClick={handleStartNew}
                        style={{ 
                            backgroundColor: game.color || '#1674a2'
                        }}
                    >
                        Start
                    </button>
                    <button 
                        className={`start-continue-btn ${!hasProgress ? 'disabled' : ''}`}
                        onClick={handleContinue}    
                        style={{ 
                            backgroundColor: game.color || '#1674a2',
                            opacity: !hasProgress ? 0.7 : 1
                        }}
                        disabled={!hasProgress}
                    >
                        Continue
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="standalone-page game-details-page">
            <div className="game-details-header">
                <IoIosArrowBack 
                    className="back-button" 
                    onClick={handleBack} 
                    aria-label="Go back" 
                    size={24} 
                    color="#000000ff" 
                />
                <h1 className='game-details-title'>
                    {game?.gameName || 'Game Details'}
                </h1>
            </div>
            
            {renderContent()}
            
            <div className='game-details-footer'>
                <a className='footer-promo-link' target='blank' rel='noopener noreferrer' href='https://daretoconnectgames.com/'>
                    www.daretoconnectgames.com
                </a>
            </div>
        </div>
    );
};

export default GameDetails;