import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RiMenu2Line } from "react-icons/ri";
import { IoLockClosed } from "react-icons/io5";
import { motion, AnimatePresence } from 'framer-motion';
import { Browser } from '@capacitor/browser';
import subscriptionService from '../services/subscriptionService';
import versionService from '../services/versionService';
import { APP_VERSION } from '../config/appConfig';   // ← package.json version
import './GameLibrary.css';
import { useStatusBar } from '../hooks/useStatusBar';

const imageCache = new Map();

const preloadImage = (url, gameId) => {
    return new Promise((resolve, reject) => {
        if (imageCache.has(url)) {
            resolve({ url, gameId, fromCache: true });
            return;
        }
        const img = new Image();
        img.onload = () => {
            imageCache.set(url, true);
            resolve({ url, gameId, fromCache: false });
        };
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
    });
};

const SKELETON_COUNT = 6;

const SkeletonGrid = () => (
    <div className="skeleton-grid">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div key={i} className="skeleton-card">
                <div className="skeleton-pulse" />
            </div>
        ))}
    </div>
);

const GameLibrary = () => {
    useStatusBar('dark', '#ffffff');
    const navigate = useNavigate();
    const { toggleSidebar } = useOutletContext();
    const { games, refreshGames, loading, isAuthenticated, user } = useAuth();

    const [refreshing,           setRefreshing]           = useState(false);
    const [imageStates,          setImageStates]          = useState({});
    const [imagesReady,          setImagesReady]          = useState(false);  // ← skeleton fix
    const [pullState,            setPullState]            = useState({
        isPulling: false, startY: 0, pullDistance: 0, maxPullDistance: 80
    });
    const [hasSubscription,      setHasSubscription]      = useState(false);
    const [checkingSubscription, setCheckingSubscription] = useState(true);

    // Version check state
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [updateData,      setUpdateData]      = useState(null);

    const containerRef    = useRef(null);
    const pullStartY      = useRef(0);
    const preloadPromises = useRef([]);

    // ── Version check on mount ────────────────────────────────────────────────
    // Passes APP_VERSION from package.json on web.
    // versionService picks up native app version on iOS/Android/Huawei automatically.
    useEffect(() => {
        const runVersionCheck = async () => {
            const result = await versionService.checkVersion(APP_VERSION);
            console.log('[VersionCheck] result:', result);
            if (result.needsUpdate) {
                setUpdateData(result);
                setShowUpdateModal(true);
            }
        };
        runVersionCheck();
    }, []);

    // ── Subscription check ────────────────────────────────────────────────────
    useEffect(() => {
        checkUserSubscription();
    }, [user]);

    const checkUserSubscription = async () => {
        if (!isAuthenticated || !user?.id) {
            setHasSubscription(false);
            setCheckingSubscription(false);
            return;
        }
        try {
            setCheckingSubscription(true);
            const subscription = await subscriptionService.getUserSubscription();
            let isActive = false;
            if (subscription) {
                if (subscription.status === 'Active') {
                    isActive = true;
                } else if (subscription.toDate) {
                    isActive = new Date(subscription.toDate) > new Date();
                }
            }
            setHasSubscription(isActive);
        } catch (error) {
            console.error('Error checking subscription:', error);
            setHasSubscription(false);
        } finally {
            setCheckingSubscription(false);
        }
    };

    // ── Games + image loading ─────────────────────────────────────────────────
    useEffect(() => {
        if (!games || games.length === 0) {
            loadGames();
        } else {
            initializeImageStates();
            preloadImages();
        }
    }, [games]);

    const initializeImageStates = () => {
        if (!games || games.length === 0) return;
        const initialStates = {};
        games.forEach(game => {
            initialStates[game.id] = {
                loading: !imageCache.has(game.image1),
                loaded:  imageCache.has(game.image1),
                error:   false
            };
        });
        setImageStates(initialStates);
    };

    const preloadImages = async () => {
        if (!games || games.length === 0) return;

        // Reset so skeletons show during every load/refresh cycle
        setImagesReady(false);

        preloadPromises.current = games.map(game =>
            preloadImage(game.image1, game.id)
                .then(result => {
                    setImageStates(prev => ({
                        ...prev,
                        [result.gameId]: { loading: false, loaded: true, error: false }
                    }));
                })
                .catch(() => {
                    setImageStates(prev => ({
                        ...prev,
                        [game.id]: { loading: false, loaded: false, error: true }
                    }));
                })
        );

        await Promise.allSettled(preloadPromises.current);

        // All images resolved (loaded or errored) — now reveal the real grid
        setImagesReady(true);
    };

    const loadGames = async (forceRefresh = false) => {
        try { await refreshGames(forceRefresh); } catch (err) { console.log(err.message); }
    };

    const handleImageLoad = (gameId) => setImageStates(prev => ({
        ...prev, [gameId]: { ...prev[gameId], loading: false, loaded: true, error: false }
    }));

    const handleImageError = (gameId, e) => {
        e.target.style.display = 'none';
        setImageStates(prev => ({
            ...prev, [gameId]: { ...prev[gameId], loading: false, loaded: false, error: true }
        }));
    };

    // ── Pull to refresh ───────────────────────────────────────────────────────
    const handlePullStart = (e) => {
        if (containerRef.current?.scrollTop === 0) {
            const startY = e.touches ? e.touches[0].pageY : e.clientY;
            pullStartY.current = startY;
            setPullState(prev => ({ ...prev, isPulling: true, startY, pullDistance: 0 }));
        }
    };

    const handlePullMove = (e) => {
        if (!pullState.isPulling) return;
        const currentY     = e.touches ? e.touches[0].pageY : e.clientY;
        const pullDistance = Math.max(0, currentY - pullStartY.current);
        setPullState(prev => ({ ...prev, pullDistance: Math.min(pullDistance, prev.maxPullDistance) }));
    };

    const handlePullEnd = useCallback(async () => {
        if (!pullState.isPulling) return;
        if (pullState.pullDistance > 50) {
            setRefreshing(true);
            setImagesReady(false); // show skeletons during refresh
            try {
                await refreshGames(true);
                await checkUserSubscription();
                imageCache.clear();
                initializeImageStates();
                await preloadImages();
            } catch (err) { console.log(err.message); }
            finally { setRefreshing(false); }
        }
        setPullState({ isPulling: false, startY: 0, pullDistance: 0, maxPullDistance: 80 });
    }, [pullState, refreshGames, games]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const onTouchStart = (e) => handlePullStart(e);
        const onTouchMove  = (e) => handlePullMove(e);
        const onTouchEnd   = ()  => handlePullEnd();
        const onMouseDown  = (e) => handlePullStart(e);
        const onMouseMove  = (e) => handlePullMove(e);
        const onMouseUp    = ()  => handlePullEnd();
        container.addEventListener('touchstart', onTouchStart, { passive: false });
        container.addEventListener('touchmove',  onTouchMove,  { passive: false });
        container.addEventListener('touchend',   onTouchEnd);
        container.addEventListener('mousedown',  onMouseDown);
        container.addEventListener('mousemove',  onMouseMove);
        container.addEventListener('mouseup',    onMouseUp);
        container.addEventListener('mouseleave', onMouseUp);
        return () => {
            container.removeEventListener('touchstart', onTouchStart);
            container.removeEventListener('touchmove',  onTouchMove);
            container.removeEventListener('touchend',   onTouchEnd);
            container.removeEventListener('mousedown',  onMouseDown);
            container.removeEventListener('mousemove',  onMouseMove);
            container.removeEventListener('mouseup',    onMouseUp);
            container.removeEventListener('mouseleave', onMouseUp);
        };
    }, [handlePullEnd]);

    const handleGameClick = async (game) => {
        if (game.id === 1) { navigate(`/games/${game.id}`); return; }
        if (!isAuthenticated) { navigate('/register'); return; }
        if (!hasSubscription) {
            navigate('/subscriptions', {
                state: { from: '/library', gameId: game.id, message: 'Subscribe to unlock all premium games!' }
            });
            return;
        }
        navigate(`/games/${game.id}`);
    };

    // ── Forced update handler — no dismiss, no Later button ──────────────────
    const handleUpdate = async () => {
        if (updateData?.url) {
            try { await Browser.open({ url: updateData.url }); } catch {}
        }
        // Modal stays open on native (force=1) — user must update
        // On web, close after opening the link since there's no app store to install from
        const isNative = window.Capacitor?.isNativePlatform?.() ?? false;
        if (!isNative) setShowUpdateModal(false);
    };

    const backdropVariants = {
        hidden:  { opacity: 0 },
        visible: { opacity: 1 },
        exit:    { opacity: 0 },
    };
    const modalVariants = {
        hidden:  { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0 },
        exit:    { opacity: 0, y: 50 },
    };

    const pullProgress    = Math.min(pullState.pullDistance / 50, 1);
    const spinnerRotation = pullProgress * 360;

    // ── Render ────────────────────────────────────────────────────────────────
    // showContent is true only when games are loaded AND all images have resolved.
    // Until then, SkeletonGrid is shown — no flash, no blank screen.
    const showContent = !loading && games && games.length > 0 && imagesReady;

    return (
        <>
            <div className="library-container" ref={containerRef}>

                {/* Pull to refresh indicator */}
                <div
                    className="pull-to-refresh-indicator"
                    style={{
                        opacity:   pullState.pullDistance > 0 ? 1 : 0,
                        transform: `translateY(${Math.min(pullState.pullDistance, 60) - 60}px)`
                    }}
                >
                    <div className="pull-indicator-content">
                        <div className="refresh-spinner" style={{ transform: `rotate(${spinnerRotation}deg)` }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="#1674a2" strokeWidth="2"
                                    strokeDasharray="60" strokeDashoffset="60" strokeLinecap="round"/>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Header — always visible immediately */}
                <header className="library-header">
                    <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Open menu">
                        <span className="toggle-icon"><RiMenu2Line /></span>
                    </button>
                    <h1 className="library-title">Choose a Game</h1>
                </header>

                {/* Skeletons until games AND images are fully ready */}
                {!showContent ? (
                    <SkeletonGrid />
                ) : (
                    <div className="scroll-content">
                        <div className="games-grid">
                            {games.map((game) => {
                                const imageState   = imageStates[game.id] || { loading: false, loaded: false, error: false };
                                const showSkeleton = !imageState.loaded && !imageState.error;
                                const isLocked     = game.id !== 1 && !hasSubscription && !checkingSubscription;

                                return (
                                    <div
                                        key={game.id}
                                        className={`game-card ${isLocked ? 'locked' : ''}`}
                                        onClick={() => handleGameClick(game)}
                                    >
                                        {isLocked && (
                                            <div className="game-lock-overlay">
                                                <IoLockClosed className="lock-icon" />
                                            </div>
                                        )}

                                        <div className="game-card-image-container">
                                            {!imageState.error && (
                                                <img
                                                    src={game.image1}
                                                    alt={game.gameName}
                                                    className={`game-card-image ${imageState.loaded ? 'loaded' : ''}`}
                                                    loading="lazy"
                                                    onLoad={() => handleImageLoad(game.id)}
                                                    onError={(e) => handleImageError(game.id, e)}
                                                    style={{ display: imageState.loaded ? 'block' : 'none' }}
                                                />
                                            )}
                                            {imageState.error && (
                                                <div
                                                    className="game-fallback"
                                                    style={{ backgroundColor: game?.color || '#1674a2' }}
                                                >
                                                    {game?.gameName?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                            )}
                                        </div>

                                        <div className="game-name-container">
                                            {game.id === 1 && <span className="game-name">{game.gameName}</span>}
                                        </div>

                                        {/* Per-card skeleton shown while that card's image loads */}
                                        <div className="skeleton-container">
                                            {showSkeleton && <div className="game-card-skeleton" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="promo-footer">
                            <a className="site-link" target="blank" rel="noopener noreferrer"
                                href="https://daretoconnectgames.com/">
                                www.daretoconnectgames.com
                            </a>
                        </div>
                    </div>
                )}

                {refreshing && (
                    <div className="refreshing-overlay">
                        <div className="spinner" />
                    </div>
                )}
            </div>

            {/* ── Forced Update Modal — no dismiss, no Later button ─────────── */}
            <AnimatePresence>
                {showUpdateModal && (
                    <motion.div
                        className="modal-backdrop"
                        variants={backdropVariants}
                        initial="hidden" animate="visible" exit="exit"
                        // Backdrop click does nothing — update is mandatory
                    >
                        <motion.div
                            className="modal-dialog modal-dialog-centered"
                            role="document"
                            variants={modalVariants}
                            initial="hidden" animate="visible" exit="exit"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="version-popup-content">
                                <div className="popup-modal-body">
                                    {/* No cancel/close button — update is forced */}
                                    <h5 className="version-popup-title">{updateData?.title}</h5>
                                    <p  className="version-popup-message">{updateData?.message}</p>
                                    <div className="version-popup-btns">
                                        <motion.div
                                            className="version-popup-btn-yes"
                                            onClick={handleUpdate}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <p>Update Now</p>
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default GameLibrary;