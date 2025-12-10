import React from 'react';
import { useNavigate } from 'react-router-dom';
import './GameLibrary.css';
import cardImage from '../assets/Image Icons/Image - Couples therapy.png';

const GameLibrary = () => {
    const navigate = useNavigate();
    
    const games = [
        { id: 1, title: 'Chiling', category: 'Free Trial', color: '#FF6B6B', image: cardImage },
        { id: 2, title: 'Chiling', category: 'Free Trial', color: '#fbff05ff', image: cardImage },
        { id: 3, title: 'Chiling', category: 'Free Trial', color: '#14611eff', image: cardImage },
        { id: 4, title: 'Chiling', category: 'Free Trial', color: '#f709ffff', image: cardImage },
        { id: 5, title: 'Chiling', category: 'Free Trial', color: '#f709ffff', image: cardImage },
    ];

    const handleGameClick = (gameId) => {
        // Navigate to standalone game details page (without sidebar)
        navigate(`/games/${gameId}`);
    };

    const handlePlayClick = (gameId, e) => {
        e.stopPropagation();
        // Navigate to standalone card page (without sidebar)
        navigate(`/card/${gameId}`);
    };

    return (
        <div className="library-container">
            {/* ... rest of the component */}
            <h1 className='library-title'>Choose a game</h1>
            <div className="games-grid">
                {games.map((game) => (
                    <div 
                        key={game.id} 
                        className="game-card"
                        // style={{ '--card-color': game.color }}
                        onClick={() => handleGameClick(game.id)}
                    >
                        {/* ... card content */}
                        <img src={game.image} alt={game.title} className="game-card-image" />
                        {/* <button 
                            className="game-play-btn"
                            onClick={(e) => handlePlayClick(game.id, e)}
                        >
                            Play Now
                        </button> */}
                    </div>
                ))}
            </div>
            
            {/* ... rest of the component */}
        </div>
    );
};

export default GameLibrary;