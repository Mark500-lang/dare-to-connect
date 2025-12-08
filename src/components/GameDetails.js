import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './GameDetails.css';

const GameDetails = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();

    const game = {
        id: gameId,
        title: 'Chiling',
        description: 'A relaxing game to help you unwind and connect with yourself.',
        instructions: 'Follow the prompts to engage in mindfulness activities.',
        duration: '20 minutes',
        players: '1-4 players',
        category: 'Free Trial',
        difficulty: 'Easy',
        rating: '4.8'
    };

    const handleBack = () => {
        navigate(-1); // Go back to previous page
    };

    return (
        <div className="standalone-page game-details-page">
            {/* Back button instead of sidebar toggle */}
            <button 
                className="back-button"
                onClick={handleBack}
                aria-label="Go back"
            >
                ← Back
            </button>
            
            <div className="game-details-content">
                <div className="game-header">
                    <h1>{game.title}</h1>
                    <div className="game-meta">
                        <span className="game-category">{game.category}</span>
                        <span className="game-duration">⏱️ {game.duration}</span>
                        <span className="game-players">👥 {game.players}</span>
                        <span className="game-rating">⭐ {game.rating}</span>
                    </div>
                </div>
                
                <div className="game-description-section">
                    <h2>About This Game</h2>
                    <p>{game.description}</p>
                </div>
                
                <div className="game-instructions-section">
                    <h2>How to Play</h2>
                    <p>{game.instructions}</p>
                    <ul className="instructions-list">
                        <li>Find a quiet, comfortable space</li>
                        <li>Follow the audio prompts</li>
                        <li>Take deep breaths when prompted</li>
                        <li>Share your experience (optional)</li>
                    </ul>
                </div>
                
                <div className="action-section">
                    <button 
                        className="primary-action-btn"
                        onClick={() => navigate(`/card/${gameId}`)}
                    >
                        🎮 Start Playing Now
                    </button>
                    <button className="secondary-action-btn">
                        👥 Invite Friends
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GameDetails;