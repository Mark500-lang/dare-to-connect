import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box } from '@mui/material';
import { RiMenu2Line } from "react-icons/ri";
import './GameLibrary.css';

const GameLibrary = () => {
    const navigate = useNavigate();
    const { toggleSidebar } = useOutletContext();
    const { games, refreshGames, loading, error, isAuthenticated } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [pullState, setPullState] = useState({
        isPulling: false,
        startY: 0,
        pullDistance: 0,
        maxPullDistance: 80
    });
    
    const containerRef = useRef(null);
    const pullStartY = useRef(0);

    useEffect(() => {
        // Initial load if games not already loaded
        if (!games || games.length === 0) {
            loadGames();
        }
    }, []);

    const loadGames = async (forceRefresh = false) => {
        try {
            await refreshGames(forceRefresh);
        } catch (err) {
            console.log('Error loading games:', err.message);
        }
    };

    const handlePullStart = (e) => {
        if (containerRef.current && containerRef.current.scrollTop === 0) {
            const startY = e.touches ? e.touches[0].pageY : e.clientY;
            pullStartY.current = startY;
            setPullState(prev => ({
                ...prev,
                isPulling: true,
                startY,
                pullDistance: 0
            }));
        }
    };

    const handlePullMove = (e) => {
        if (!pullState.isPulling) return;
        
        const currentY = e.touches ? e.touches[0].pageY : e.clientY;
        const pullDistance = Math.max(0, currentY - pullStartY.current);
        
        setPullState(prev => ({
            ...prev,
            pullDistance: Math.min(pullDistance, prev.maxPullDistance)
        }));
    };

    const handlePullEnd = useCallback(async () => {
        if (!pullState.isPulling) return;
        
        if (pullState.pullDistance > 50) {
            // Trigger refresh
            setRefreshing(true);
            try {
                await refreshGames(true);
            } catch (err) {
                console.log('Refresh error:', err.message);
            } finally {
                setRefreshing(false);
            }
        }
        
        // Reset pull state
        setPullState({
            isPulling: false,
            startY: 0,
            pullDistance: 0,
            maxPullDistance: 80
        });
    }, [pullState, refreshGames]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleTouchStart = (e) => handlePullStart(e);
        const handleTouchMove = (e) => handlePullMove(e);
        const handleTouchEnd = () => handlePullEnd();

        const handleMouseDown = (e) => handlePullStart(e);
        const handleMouseMove = (e) => handlePullMove(e);
        const handleMouseUp = () => handlePullEnd();

        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);

        container.addEventListener('mousedown', handleMouseDown);
        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseup', handleMouseUp);
        container.addEventListener('mouseleave', handleMouseUp);

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);

            container.removeEventListener('mousedown', handleMouseDown);
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseup', handleMouseUp);
            container.removeEventListener('mouseleave', handleMouseUp);
        };
    }, [handlePullEnd]);

    const handleGameClick = async (game) => {
        // Game ID 1 (Free Trial) is always accessible
        if (game.id === 1) {
            navigate(`/games/${game.id}`);
            return;
        }

        // Check if user is authenticated
        if (!isAuthenticated) {
            // Redirect to registration page if not logged in
            navigate('/register');
            return;
        }

        // For now, allow access to all games
        // In the future, we'll add subscription check here
        navigate(`/games/${game.id}`);
    };

    // Calculate pull indicator rotation and opacity
    const pullProgress = Math.min(pullState.pullDistance / 50, 1);
    const spinnerRotation = pullProgress * 360;

    return (
        <div 
            className="library-container" 
            ref={containerRef}
            style={{
                touchAction: 'pan-y',
                overflow: 'auto',
                height: '100vh'
            }}
        >
            {/* Pull to refresh indicator - Hidden until pulled */}
            <div 
                className="pull-to-refresh-indicator"
                style={{
                    opacity: pullState.pullDistance > 0 ? 1 : 0,
                    transform: `translateY(${Math.min(pullState.pullDistance, 60) - 60}px)`
                }}
            >
                <div className="pull-indicator-content">
                    <div 
                        className="refresh-spinner"
                        style={{
                            transform: `rotate(${spinnerRotation}deg)`
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="#1674a2" strokeWidth="2" strokeDasharray="60" strokeDashoffset="60" strokeLinecap="round"/>
                        </svg>
                    </div>
                </div>
            </div>

            {/* Sticky Header with Hamburger Menu */}
            <header className="library-header">
                <button 
                    className="sidebar-toggle"
                    onClick={toggleSidebar}
                    aria-label="Open menu"
                >
                    <span className="toggle-icon"><RiMenu2Line/></span>
                </button>
                <h1 className='library-title'>Choose a Game</h1>
            </header>
            
            {/* Games Grid */}
            <div className="games-grid">
                {loading && !games.length ? (
                    // Loading skeleton
                    Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="game-card-skeleton">
                            <div className="skeleton-image"></div>
                        </div>
                    ))
                ) : (
                    // Display games
                    games && games.length > 0 ? (
                        games.map((game) => (
                            <div 
                                key={game.id} 
                                className="game-card"
                                onClick={() => handleGameClick(game)}
                            >
                                <img 
                                    src={game.image1} 
                                    alt={game.gameName} 
                                    className="game-card-image"
                                    loading="lazy"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = `
                                            <div class="game-fallback" style="background-color: ${game.color || '#1674a2'};">
                                                ${game.gameName.charAt(0).toUpperCase()}
                                            </div>
                                        `;
                                    }}
                                />
                                {/* <div className="game-card-title-overlay">
                                    <h3 className="game-card-title">{game.gameName}</h3>
                                </div> */}
                            </div>
                        ))
                    ) : (
                        // No games state - only shown after attempted load
                        !loading && (
                            <div className="no-games-message">
                                <p>No games available</p>
                                <button 
                                    onClick={() => loadGames(true)}
                                    className="retry-button"
                                >
                                    Try Again
                                </button>
                            </div>
                        )
                    )
                )}
            </div>
            
            {/* Refresh indicator overlay */}
            {refreshing && (
                <div className="refreshing-overlay">
                    <div className="spinner"></div>
                </div>
            )}
            
            <div className='promo-footer'>
                <a className='site-link' target='blank' href='https://daretoconnectgames.com/'>
                    www.daretoconnectgames.com
                </a>
            </div>
        </div>
    );
};

export default GameLibrary;