import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import gamesService from '../services/gameService';
import { Box, CircularProgress } from '@mui/material';
import { IoIosArrowBack } from "react-icons/io";
import './GameDetails.css';

const GameDetails = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasProgress, setHasProgress] = useState(false);

    useEffect(() => {
        loadGameDetails();
        checkProgress();
    }, [gameId]);

    const loadGameDetails = async () => {
        setLoading(true);
        
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
                    <img 
                        src={game.image2 || game.image1} 
                        alt={game.gameName} 
                        className="game-main-image"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `
                                <div class="game-fallback-large" style="background-color: ${game.color || '#1674a2'};">
                                    <h2>${game.gameName}</h2>
                                </div>
                            `;
                        }}
                    />
                </div>
                
                <div className="game-action-buttons">
                    <button 
                        className="start-continue-btn"
                        onClick={handleStartNew}
                        style={{ 
                            backgroundColor: game.color || '#1674a2'
                        }}
                    >
                        Start New
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
                        {hasProgress ? 'Continue' : 'No Progress'}
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
        </div>
    );
};

export default GameDetails;