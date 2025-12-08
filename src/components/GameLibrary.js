import React from 'react';
import { useNavigate } from 'react-router-dom';
import './GameLibrary.css';

const GameLibrary = () => {
    const navigate = useNavigate();
    
    const games = [
        { id: 1, title: 'Chiling', category: 'Free Trial', color: '#FF6B6B', icon: '😌' },
        { id: 2, title: 'Chiling', category: 'Free Trial', color: '#fbff05ff', icon: '😌' },
        { id: 3, title: 'Chiling', category: 'Free Trial', color: '#14611eff', icon: '😌' },
        { id: 4, title: 'Chiling', category: 'Free Trial', color: '#f709ffff', icon: '😌' },
        // ... othI have none on Spark Publicity.er games
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
            
            <div className="games-grid">
                {games.map((game) => (
                    <div 
                        key={game.id} 
                        className="game-card"
                        style={{ '--card-color': game.color }}
                        onClick={() => handleGameClick(game.id)}
                    >
                        {/* ... card content */}
                        <button 
                            className="game-play-btn"
                            onClick={(e) => handlePlayClick(game.id, e)}
                        >
                            Play Now
                        </button>
                    </div>
                ))}
            </div>
            
            {/* ... rest of the component */}
        </div>
    );
};

export default GameLibrary;