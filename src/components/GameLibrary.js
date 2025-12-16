import React from 'react';
import { useNavigate } from 'react-router-dom';
import './GameLibrary.css';
import gamesData from '../data/gamesData';

const GameLibrary = () => {
    const navigate = useNavigate();
    
    const handleGameClick = (gameId) => {
        navigate(`/games/${gameId}`);
    };

    return (
        <div className="library-container">
            <h1 className='library-title'>Choose a Game</h1>
            
            <div className="games-grid">
                {gamesData.map((game) => (
                    <div 
                        key={game.id} 
                        className="game-card"
                        // style={{ 
                        //     '--card-color': game.color,
                        //     '--card-bg-color': game.backgroundColor 
                        // }}
                        onClick={() => handleGameClick(game.id)}
                    >
                    <img src={game.image} alt={game.title} className="game-card-image" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GameLibrary;