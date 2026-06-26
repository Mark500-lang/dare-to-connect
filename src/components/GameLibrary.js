import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RiMenu2Line } from 'react-icons/ri';
import { IoLockClosed } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import { Browser } from '@capacitor/browser';
import subscriptionService from '../services/subscriptionService';
import versionService from '../services/versionService';
import { APP_VERSION } from '../config/appConfig';
import './GameLibrary.css';
import { useStatusBar } from '../hooks/useStatusBar';

// ── Image cache ───────────────────────────────────────────────────────────────
const imageCache = new Map();

const preloadImage = (url, id) =>
    new Promise((resolve, reject) => {
        if (!url) { resolve({ url, id, fromCache: false }); return; }
        // Normalise: trim whitespace/newlines, ensure absolute URL
        const cleanUrl = normaliseImageUrl(url);
        if (imageCache.has(cleanUrl)) { resolve({ url: cleanUrl, id, fromCache: true }); return; }
        const img = new Image();
        img.onload  = () => { imageCache.set(cleanUrl, true); resolve({ url: cleanUrl, id, fromCache: false }); };
        img.onerrorlibrary = () => reject(new Error(`Failed to load: ${cleanUrl}`));
        img.src = cleanUrl;
    });

// Handles relative paths like "storage/packs/..." returned by the backend
const BASE_URL = 'https://admin.daretoconnectgames.com/';
const normaliseImageUrl = (url) => {
    if (!url) return null;
    const trimmed = url.trim();
    if (trimmed.startsWith('http')) return trimmed;
    return BASE_URL + trimmed;
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SKELETON_COUNT = 6;
const SkeletonGrid = () => (
    <div className="gl-skeleton-wrap">
        {/* Free game skeleton — horizontal */}
        <div className="gl-free-skeleton">
            <div className="gl-free-skeleton-image skeleton-pulse" />
            <div className="gl-free-skeleton-text">
                <div className="skeleton-pulse gl-skel-line gl-skel-line--title" />
                <div className="skeleton-pulse gl-skel-line gl-skel-line--sub" />
            </div>
        </div>
        {/* Pack skeletons — 2-col grid */}
        <div className="games-grid" style={{ paddingTop: 0 }}>
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <div key={i} className="skeleton-card">
                    <div className="skeleton-pulse" />
                </div>
            ))}
        </div>
    </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
const GameLibrary = () => {
    useStatusBar('dark', '#ffffff');
    const navigate          = useNavigate();
    const { toggleSidebar } = useOutletContext();
    const { games, refreshGames, loading } = useAuth();

    const [packs,           setPacks]           = useState([]);
    const [ownedPacks,      setOwnedPacks]      = useState([]);
    const [packsLoading,    setPacksLoading]    = useState(true);
    const [refreshing,      setRefreshing]      = useState(false);
    const [imageStates,     setImageStates]     = useState({});
    const [imagesReady,     setImagesReady]     = useState(false);
    const [pullState,       setPullState]       = useState({
        isPulling: false, startY: 0, pullDistance: 0, maxPullDistance: 80,
    });
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [updateData,      setUpdateData]      = useState(null);

    const containerRef = useRef(null);
    const pullStartY   = useRef(0);

    // ── Version check ─────────────────────────────────────────────────────────
    useEffect(() => {
        versionService.checkVersion(APP_VERSION).then(result => {
            if (result.needsUpdate) { setUpdateData(result); setShowUpdateModal(true); }
        });
    }, []);

    // ── Initial load ──────────────────────────────────────────────────────────
    useEffect(() => { loadAll(); }, []);

    const loadAll = async (forceRefresh = false) => {
        try {
            setPacksLoading(true);
            const [, packsResult] = await Promise.allSettled([
                refreshGames(forceRefresh),
                subscriptionService.getPacks(forceRefresh),
            ]);
            if (packsResult.status === 'fulfilled') {
                setPacks(packsResult.value.packs     ?? []);
                setOwnedPacks(packsResult.value.ownedPacks ?? []);
            }
        } catch (err) {
            console.error('loadAll error:', err);
        } finally {
            setPacksLoading(false);
        }
    };

    // ── Image preloading ──────────────────────────────────────────────────────
    useEffect(() => {
        if ((!games || games.length === 0) && packs.length === 0) return;
        initImageStates();
        preloadAll();
    }, [games, packs]);

    const initImageStates = () => {
        const s = {};
        // Free game (id=1) only
        const free = (games || []).find(g => g.id === 1);
        if (free) {
            const url = normaliseImageUrl(free.image1);
            s[free.id] = { loaded: imageCache.has(url), error: false };
        }
        // Packs
        packs.forEach(pack => {
            const url = normaliseImageUrl(pack.image);
            s[`pack_${pack.id}`] = {
                loaded: url ? imageCache.has(url) : false,
                error:  !url,
            };
        });
        setImageStates(s);
    };

    const preloadAll = async () => {
        setImagesReady(false);
        const promises = [];

        const free = (games || []).find(g => g.id === 1);
        if (free?.image1) {
            promises.push(
                preloadImage(free.image1, free.id)
                    .then(r  => setImageStates(p => ({ ...p, [free.id]:       { loaded: true,  error: false } })))
                    .catch(() => setImageStates(p => ({ ...p, [free.id]:       { loaded: false, error: true  } })))
            );
        }

        packs.forEach(pack => {
            const key = `pack_${pack.id}`;
            if (!pack.image) return;
            promises.push(
                preloadImage(pack.image, key)
                    .then(r  => setImageStates(p => ({ ...p, [key]: { loaded: true,  error: false } })))
                    .catch(() => setImageStates(p => ({ ...p, [key]: { loaded: false, error: true  } })))
            );
        });

        await Promise.allSettled(promises);
        setImagesReady(true);
    };

    // ── Pull to refresh ───────────────────────────────────────────────────────
    const handlePullStart = (e) => {
        if (containerRef.current?.scrollTop === 0) {
            const y = e.touches ? e.touches[0].pageY : e.clientY;
            pullStartY.current = y;
            setPullState(p => ({ ...p, isPulling: true, startY: y, pullDistance: 0 }));
        }
    };
    const handlePullMove = (e) => {
        if (!pullState.isPulling) return;
        const y = e.touches ? e.touches[0].pageY : e.clientY;
        const d = Math.max(0, y - pullStartY.current);
        setPullState(p => ({ ...p, pullDistance: Math.min(d, p.maxPullDistance) }));
    };
    const handlePullEnd = useCallback(async () => {
        if (!pullState.isPulling) return;
        if (pullState.pullDistance > 50) {
            setRefreshing(true);
            setImagesReady(false);
            try {
                subscriptionService.clearPacksCache();
                imageCache.clear();
                await loadAll(true);
                await preloadAll();
            } catch (e) { console.log(e.message); }
            finally { setRefreshing(false); }
        }
        setPullState({ isPulling: false, startY: 0, pullDistance: 0, maxPullDistance: 80 });
    }, [pullState]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const opts = { passive: false };
        const ts = e => handlePullStart(e);
        const tm = e => handlePullMove(e);
        const te = () => handlePullEnd();
        el.addEventListener('touchstart', ts, opts);
        el.addEventListener('touchmove',  tm, opts);
        el.addEventListener('touchend',   te);
        el.addEventListener('mousedown',  ts);
        el.addEventListener('mousemove',  tm);
        el.addEventListener('mouseup',    te);
        el.addEventListener('mouseleave', te);
        return () => {
            el.removeEventListener('touchstart', ts);
            el.removeEventListener('touchmove',  tm);
            el.removeEventListener('touchend',   te);
            el.removeEventListener('mousedown',  ts);
            el.removeEventListener('mousemove',  tm);
            el.removeEventListener('mouseup',    te);
            el.removeEventListener('mouseleave', te);
        };
    }, [handlePullEnd]);

    // ── Navigation ────────────────────────────────────────────────────────────
    const handleFreeGameClick = () => {
        const free = (games || []).find(g => g.id === 1);
        if (free) navigate(`/games/${free.id}`);
    };

    const handlePackClick = (pack) => {
        const owned = subscriptionService.isPackOwned(pack.productId, ownedPacks);
        if (owned) {
                // navigate('/subscriptions', { state: { packId: pack.id, productId: pack.productId } });

            navigate(`/pack/${pack.id}`, { state: { pack, ownedPacks } });
        } else {
                        // navigate(`/pack/${pack.id}`, { state: { pack, ownedPacks } });

            navigate('/subscriptions', { state: { packId: pack.id, productId: pack.productId } });
        }
    };

    const handleUpdate = async () => {
        if (updateData?.url) { try { await Browser.open({ url: updateData.url }); } catch {} }
        const isNative = window.Capacitor?.isNativePlatform?.() ?? false;
        if (!isNative) setShowUpdateModal(false);
    };

    // ── Derived ───────────────────────────────────────────────────────────────
    const freeGame       = (games || []).find(g => g.id === 1);
    const dataReady      = !loading && !packsLoading;
    const showContent    = dataReady && imagesReady;
    const pullProgress   = Math.min(pullState.pullDistance / 50, 1);
    const spinnerRot     = pullProgress * 360;

    const freeImgSrc = freeGame ? normaliseImageUrl(freeGame.image1) : null;

    const backdropV = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
    const modalV    = { hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 50 } };

    return (
        <>
            <div className="library-container" ref={containerRef}>

                {/* Pull indicator */}
                <div className="pull-to-refresh-indicator" style={{
                    opacity:   pullState.pullDistance > 0 ? 1 : 0,
                    transform: `translateY(${Math.min(pullState.pullDistance, 60) - 60}px)`,
                }}>
                    <div className="pull-indicator-content">
                        <div className="refresh-spinner" style={{ transform: `rotate(${spinnerRot}deg)` }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="#1674a2" strokeWidth="2"
                                    strokeDasharray="60" strokeDashoffset="60" strokeLinecap="round"/>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Header */}
                <header className="library-header">
                    <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Open menu">
                        <span className="toggle-icon"><RiMenu2Line /></span>
                    </button>
                    <h1 className="library-title">Choose a Game</h1>
                </header>

                {!showContent ? <SkeletonGrid /> : (
                    <div className="scroll-content">

                        {/* ── Section 1: Free game — horizontal card ── */}
                        {freeGame && (
                            <div className="free-section">
                                {/* <p className="section-label">Try the app</p> */}
                                <div className="free-card">

                                    {/* Left: square image */}
                                    <div className="free-card-image-wrap" onClick={handleFreeGameClick}>
                                        {imageStates[freeGame.id]?.error || !freeImgSrc ? (
                                            <div className="free-card-fallback" style={{ backgroundColor: freeGame.color || '#000' }}>
                                                {freeGame.gameName?.charAt(0)}
                                            </div>
                                        ) : (
                                            <img
                                                src={freeImgSrc}
                                                alt={freeGame.gameName}
                                                className={`free-card-image ${imageStates[freeGame.id]?.loaded ? 'loaded' : ''}`}
                                            />
                                        )}
                                    </div>

                                    {/* Right: text + CTA */}
                                    <div className="free-card-body">
                                        {/* <span className="free-badge">FREE</span> */}
                                        <h2 className="free-card-title">{freeGame.gameName}</h2>
                                        <p className="free-card-sub">No account needed. Start playing now.</p>
                                        {/* <div className="free-card-cta">Play Now →</div> */}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Section 2: Game packs ── */}
                        {packs.length > 0 && (
                            <div className="packs-section">
                                <p className="section-label">Game Packs</p>
                                <div className="games-grid">
                                    {packs.map(pack => {
                                        const key       = `pack_${pack.id}`;
                                        const imgState  = imageStates[key] ?? { loaded: false, error: false };
                                        const imgSrc    = normaliseImageUrl(pack.image);
                                        const isOwned   = subscriptionService.isPackOwned(pack.productId, ownedPacks);
                                        const isBundle  = pack.productId === 'com.daretoconnect.pack.bundle';

                                        return (
                                            <div
                                                key={pack.id}
                                                className={`game-card ${isOwned ? '' : 'locked'}`}
                                                onClick={() => handlePackClick(pack)}
                                            >
                                                {/* Lock */}
                                                {!isOwned && (
                                                    <div className="game-lock-overlay">
                                                        <IoLockClosed className="lock-icon" />
                                                    </div>
                                                )}

                                                {/* Best value badge */}
                                                {isBundle && (
                                                    <div className="best-value-badge">BEST VALUE</div>
                                                )}

                                                {/* Image */}
                                                <div className="game-card-image-container">
                                                    {imgSrc && !imgState.error ? (
                                                        <img
                                                            src={imgSrc}
                                                            alt={pack.packName}
                                                            className={`game-card-image ${imgState.loaded ? 'loaded' : ''}`}
                                                        />
                                                    ) : (
                                                        <div className="game-fallback" style={{ backgroundColor: pack.color || '#1674a2' }}>
                                                            {pack.packName?.charAt(0)}
                                                        </div>
                                                    )}

                                                    {/* Per-card skeleton while image loads */}
                                                    {!imgState.loaded && !imgState.error && imgSrc && (
                                                        <div className="skeleton-container">
                                                            <div className="game-card-skeleton" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Name + owned */}
                                                <div className="game-name-container">
                                                    { !isOwned && <span className="game-name">{pack.packName}</span> }
                                                    {isOwned && <span className="owned-badge">OWNED ✓</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="promo-footer">
                            <a className="footer-promo-link" target="_blank" rel="noopener noreferrer"
                                href="https://daretoconnectgames.com/">
                                www.daretoconnectgames.com
                            </a>
                        </div>
                    </div>
                )}

                {refreshing && (
                    <div className="refreshing-overlay"><div className="spinner" /></div>
                )}
            </div>

            {/* Update modal */}
            <AnimatePresence>
                {showUpdateModal && (
                    <motion.div className="modal-backdrop" variants={backdropV}
                        initial="hidden" animate="visible" exit="exit">
                        <motion.div className="modal-dialog modal-dialog-centered" role="document"
                            variants={modalV} initial="hidden" animate="visible" exit="exit"
                            onClick={e => e.stopPropagation()}>
                            <div className="version-popup-content">
                                <div className="popup-modal-body">
                                    <h5 className="version-popup-title">{updateData?.title}</h5>
                                    <p  className="version-popup-message">{updateData?.message}</p>
                                    <div className="version-popup-btns">
                                        <motion.div className="version-popup-btn-yes"
                                            onClick={handleUpdate} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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