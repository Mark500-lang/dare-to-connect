import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RiMenu2Line } from "react-icons/ri";
import './GameLibrary.css';

// Image cache to store loaded images
const imageCache = new Map();

// Preload image function with caching
const preloadImage = (url, gameId) => {
    return new Promise((resolve, reject) => {
        // Check cache first
        if (imageCache.has(url)) {
            resolve({ url, gameId, fromCache: true });
            return;
        }

        const img = new Image();
        img.onload = () => {
            // Cache the image URL
            imageCache.set(url, true);
            resolve({ url, gameId, fromCache: false });
        };
        img.onerror = () => {
            reject(new Error(`Failed to load image: ${url}`));
        };
        img.src = url;
    });
};

const GameLibrary = () => {
    const navigate = useNavigate();
    const { toggleSidebar } = useOutletContext();
    const { games, refreshGames, loading, error, isAuthenticated } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [imageStates, setImageStates] = useState({}); // { gameId: { loading: boolean, loaded: boolean, error: boolean } }
    const [pullState, setPullState] = useState({
        isPulling: false,
        startY: 0,
        pullDistance: 0,
        maxPullDistance: 80
    });
    
    const containerRef = useRef(null);
    const pullStartY = useRef(0);
    const preloadPromises = useRef([]);

    useEffect(() => {
        // Initial load if games not already loaded
        if (!games || games.length === 0) {
            loadGames();
        } else {
            // Initialize image states when games are loaded
            initializeImageStates();
            // Preload images
            preloadImages();
        }
    }, [games]);

    const initializeImageStates = () => {
        if (!games || games.length === 0) return;
        
        const initialStates = {};
        games.forEach(game => {
            initialStates[game.id] = {
                loading: true,
                loaded: imageCache.has(game.image1), // Check cache immediately
                error: false
            };
        });
        setImageStates(initialStates);
    };

    const preloadImages = async () => {
        if (!games || games.length === 0) return;
        
        preloadPromises.current = games.map(game => 
            preloadImage(game.image1, game.id)
                .then(result => {
                    // Update state when image loads successfully
                    setImageStates(prev => ({
                        ...prev,
                        [result.gameId]: {
                            loading: false,
                            loaded: true,
                            error: false
                        }
                    }));
                })
                .catch(err => {
                    console.warn(`Failed to preload image for game ${game.id}:`, err.message);
                    // Update state on error
                    setImageStates(prev => ({
                        ...prev,
                        [game.id]: {
                            loading: false,
                            loaded: false,
                            error: true
                        }
                    }));
                })
        );

        // Optional: Wait for all images to load (or fail) before doing something
        try {
            await Promise.allSettled(preloadPromises.current);
        } catch (err) {
            // Handle any unexpected errors
            console.warn('Error in image preloading:', err);
        }
    };

    const loadGames = async (forceRefresh = false) => {
        try {
            await refreshGames(forceRefresh);
        } catch (err) {
            console.log('Error loading games:', err.message);
        }
    };

    const handleImageLoad = (gameId) => {
        setImageStates(prev => ({
            ...prev,
            [gameId]: {
                ...prev[gameId],
                loading: false,
                loaded: true,
                error: false
            }
        }));
    };

    const handleImageError = (gameId, e) => {
        // Hide the broken image
        e.target.style.display = 'none';
        
        setImageStates(prev => ({
            ...prev,
            [gameId]: {
                ...prev[gameId],
                loading: false,
                loaded: false,
                error: true
            }
        }));
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
                
                // Clear cache and reinitialize states on refresh
                imageCache.clear();
                initializeImageStates();
                preloadImages();
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
    }, [pullState, refreshGames, games]);

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
        if (game.id === 1) {
            navigate(`/games/${game.id}`);
            return;
        }

        if (!isAuthenticated) {
            navigate('/register');
            return;
        }

        navigate(`/games/${game.id}`);
    };

    const pullProgress = Math.min(pullState.pullDistance / 50, 1);
    const spinnerRotation = pullProgress * 360;

    // Render initial loading skeletons
    if (loading && (!games || games.length === 0)) {
        return (
            <div className="library-container" ref={containerRef}>
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
                
                <div className="skeleton-grid">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="skeleton-card">
                            <div className="skeleton-pulse"></div>
                        </div>
                    ))}
                </div>
                
                <div className='promo-footer'>
                    <a className='site-link' target='blank' rel='noopener noreferrer' href='https://daretoconnectgames.com/'>
                        www.daretoconnectgames.com
                    </a>
                </div>
            </div>
        );
    }

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
            {/* Pull to refresh indicator */}
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

            {/* Sticky Header */}
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
                {games && games.length > 0 ? (
                    games.map((game) => {
                        const imageState = imageStates[game.id] || { loading: true, loaded: false, error: false };
                        const showSkeleton = imageState.loading || !imageState.loaded;
                        
                        return (
                            <div 
                                key={game.id} 
                                className="game-card"
                                onClick={() => handleGameClick(game)}
                            >
                                {/* Image Container */}
                                <div className="game-card-image-container">
                                    {/* Game Image - hidden until loaded */}
                                    {!imageState.error && (
                                        <img 
                                            src={game.image1} 
                                            alt={game.gameName} 
                                            className={`game-card-image ${imageState.loaded ? 'loaded' : ''}`}
                                            loading="lazy"
                                            onLoad={() => handleImageLoad(game.id)}
                                            onError={(e) => handleImageError(game.id, e)}
                                            style={{ 
                                                display: imageState.loaded ? 'block' : 'none'
                                            }}
                                        />
                                    )}
                                    
                                    {/* Fallback - shows on error or if no image */}
                                    {imageState.error && (
                                        <div 
                                            className="game-fallback"
                                            style={{ 
                                                backgroundColor: game?.color || '#1674a2'
                                            }}
                                        >
                                            {game?.gameName?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Pulsing Skeleton - shows while loading */}
                                <div className="skeleton-container">
                                    {showSkeleton && (
                                        <div className="game-card-skeleton"></div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
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
                )}
            </div>
            
            {/* Refresh indicator overlay */}
            {refreshing && (
                <div className="refreshing-overlay">
                    <div className="spinner"></div>
                </div>
            )}
            
            <div className='promo-footer'>
                <a className='site-link' target='blank' rel='noopener noreferrer' href='https://daretoconnectgames.com/'>
                    www.daretoconnectgames.com
                </a>
            </div>
        </div>
    );
};

export default GameLibrary;