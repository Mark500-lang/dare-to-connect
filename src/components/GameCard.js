import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGameById } from '../data/gamesData';
import './GameCard.css';
import { IoIosArrowBack } from "react-icons/io";
import { IoArrowBackCircle } from "react-icons/io5";

const GameCard = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const game = getGameById(gameId);
    
    const [currentCardIndex, setCurrentCardIndex] = useState(0);

    const currentCard = game.cards[currentCardIndex];

    const handleNextCard = () => {
        if (currentCardIndex < game.cards.length - 1) {
            setCurrentCardIndex(prev => prev + 1);
        } else {
            // Game completed
            navigate(`/games/${gameId}/`);
        }
    };

    const handlePrevCard = () => {
        if (currentCardIndex > 0) {
            setCurrentCardIndex(prev => prev - 1);
        }
    };

    const handleBack = () => {
        navigate(`/games/${gameId}`);
    };

    const handleRestart = () => {
        setCurrentCardIndex(0);
    };
    
    return (
        <div className="game-card-container">
            {/* Header */}
            <div className="game-details-header">
                <IoIosArrowBack className="back-button" onClick={handleBack} aria-label="Go back" size={24} color="#000000ff" />
                <h1 className='game-details-title'>{game.title}</h1>
            </div>
            {/* <div className="game-card-header">
            </div> */}
            <div className='game-sub-container'>

            {/* Main Card Area */}
            <div className="card-game-area">
                {/* Previous Card Button */}
                {/* <button 
                    className="nav-button prev-button"
                    onClick={handlePrevCard}
                    disabled={currentCardIndex === 0}
                    aria-label="Previous card"
                >
                    ‹
                </button> */}
                <IoArrowBackCircle 
                    className="nav-button prev-button"
                    onClick={handlePrevCard}
                    disabled={currentCardIndex === 0}
                    aria-label="Previous card"
                    style={{ 
                        color: game.color
                    }}/>
                {/* Card */}
                <div 
                    className="game-flip-card"
                    style={{ 
                        backgroundColor: game.color,
                        color: '#ffffff'
                    }}
                >
                    <h3 className="card-text">{currentCard.text}</h3>
                </div>

                {/* Next Card Button */}
                <IoArrowBackCircle 
                    className="nav-button next-button-right"
                    onClick={handleNextCard}
                    disabled={currentCardIndex === game.cards.length - 1}
                    aria-label="Next card"
                    style={{ 
                        color: game.color
                    }}/>
            </div>

            {/* Controls */}
            <div className="game-controls">
                <button 
                    className="control-btn restart-btn"
                    onClick={handleRestart}
                    style={{ 
                        backgroundColor: game.color,
                        color: '#ffffff'
                    }}
                >
                    SHUFFLE CARDS
                </button>
            </div>
            </div>
        </div>
    );
};

export default GameCard;