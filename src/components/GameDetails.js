import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGameById } from '../data/gamesData';
import './GameDetails.css';
import { IoIosArrowBack } from "react-icons/io";

const GameDetails = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const game = getGameById(gameId);

    const handleBack = () => {
        navigate('/main/library');
    };

    const handleStartNew = () => {
        navigate(`/card/${game.id}`);
    };

    const handleContinue = () => {
        navigate(`/card/${game.id}`);
    };

    return (
        <div className="standalone-page game-details-page">
            <div className="game-details-header">
                <IoIosArrowBack className="back-button" onClick={handleBack} aria-label="Go back" size={24} color="#000000ff" />
                <h1 className='game-details-title'>{game.title}</h1>
            </div>
            
            <div className="game-details-content">
                
                <div className="game-image-container">
                    <img 
                        src={game.cardImage} 
                        alt={game.title} 
                        className="game-main-image"
                    />
                </div>
                
                <div className="game-action-buttons">
                    <button 
                        className="start-continue-btn"
                        onClick={handleStartNew}
                        style={{ 
                            backgroundColor: game.color,
                        }}
                    >
                        Start
                    </button>
                    <button 
                        className="start-continue-btn"
                        onClick={handleContinue}    
                        style={{ 
                            backgroundColor: game.color,
                        }}
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GameDetails;