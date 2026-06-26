import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { IoIosArrowBack } from 'react-icons/io';
import { CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import subscriptionService from '../services/subscriptionService';
import { useStatusBar } from '../hooks/useStatusBar';
import './PackDetail.css';

// ── Image cache shared with GameLibrary ────────────────────────────────────────
const imageCache = new Map();

const preloadImage = (url) =>
    new Promise((resolve) => {
        if (!url) { resolve(false); return; }
        if (imageCache.has(url)) { resolve(true); return; }
        const img = new Image();
        img.onload  = () => { imageCache.set(url, true); resolve(true); };
        img.onerror = () => resolve(false);
        img.src = url;
    });

const PackDetail = () => {
    useStatusBar('dark', '#ffffff');
    const { packId }  = useParams();
    const navigate    = useNavigate();
    const location    = useLocation();

    // Pack + ownedPacks may be passed via route state (avoids an extra network call)
    const routePack       = location.state?.pack       ?? null;
    const routeOwnedPacks = location.state?.ownedPacks ?? [];

    const [pack,        setPack]        = useState(routePack);
    const [ownedPacks,  setOwnedPacks]  = useState(routeOwnedPacks);
    const [imageStates, setImageStates] = useState({});
    const [loading,     setLoading]     = useState(!routePack);

    // ── Load pack if not passed via state ─────────────────────────────────────
    useEffect(() => {
        if (!routePack) loadPack();
        else            initImages(routePack.games ?? []);
    }, [packId]);

    const loadPack = async () => {
        setLoading(true);
        try {
            const result = await subscriptionService.getPacks();
            const found  = (result.packs ?? []).find(p => String(p.id) === String(packId));

            if (!found) { navigate('/library'); return; }

            // Verify the user actually owns this pack
            const owned = result.ownedPacks ?? [];
            const canAccess = subscriptionService.isPackOwned(found.productId, owned);
            if (!canAccess) {
                navigate('/subscriptions', { state: { productId: found.productId } });
                return;
            }

            setPack(found);
            setOwnedPacks(owned);
            initImages(found.games ?? []);
        } catch (err) {
            console.error('PackDetail load error:', err);
            navigate('/library');
        } finally {
            setLoading(false);
        }
    };

    const initImages = async (games) => {
        const initialStates = {};
        games.forEach(g => {
            initialStates[g.id] = { loaded: imageCache.has(g.image1), error: false };
        });
        setImageStates(initialStates);

        // Preload all in parallel
        await Promise.allSettled(
            games.map(g =>
                preloadImage(g.image1).then(ok =>
                    setImageStates(prev => ({
                        ...prev,
                        [g.id]: { loaded: ok, error: !ok && !!g.image1 }
                    }))
                )
            )
        );
    };

    const handleGameClick = (game) => {
        navigate(`/games/${game.id}`);
    };

    // ── Render ────────────────────────────────────────────────────────────────
    if (loading || !pack) {
        return (
            <div className="standalone-page">
                <div className="pack-detail-loading">
                    <CircularProgress style={{ color: '#1674a2' }} />
                </div>
            </div>
        );
    }

    const games = pack.games ?? [];

    return (
        <div className="standalone-page">
            {/* Header */}
            <div className="game-details-header">
                <IoIosArrowBack
                    className="back-button"
                    color="#000000ff"
                    onClick={() => navigate('/library')}
                    aria-label="Go back"
                />
                <h1 className="game-details-title">{pack.packName}</h1>
            </div>

            <div className="pack-page-content">
                {/* Pack cover */}
                <div className="pack-page-cover">
                    {pack.image
                        ? <img src={pack.image} alt={pack.packName} className="pack-page-cover-image" />
                        : <div
                            className="pack-page-cover-fallback"
                            style={{ backgroundColor: pack.color || '#1674a2' }}
                          >
                            {pack.packName?.charAt(0).toUpperCase()}
                          </div>
                    }
                </div>

                {pack.description && (
                    <p className="pack-page-description">{pack.description}</p>
                )}

                {/* Games grid */}
                <p className="pack-page-games-label">Games in this pack</p>
                <div className="pack-page-grid">
                    {games.map((game, idx) => {
                        const imgState    = imageStates[game.id] ?? { loaded: false, error: false };
                        const showSkeleton = !imgState.loaded && !imgState.error;

                        return (
                            <motion.div
                                key={game.id}
                                className="pack-page-game-card"
                                onClick={() => handleGameClick(game)}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                whileTap={{ scale: 0.96 }}
                            >
                                <div className="pack-page-card-image-wrap">
                                    {!imgState.error && game.image1 && (
                                        <img
                                            src={game.image1}
                                            alt={game.gameName}
                                            className={`pack-page-card-image ${imgState.loaded ? 'loaded' : ''}`}
                                            style={{ display: imgState.loaded ? 'block' : 'none' }}
                                        />
                                    )}
                                    {(imgState.error || !game.image1) && (
                                        <div
                                            className="pack-page-card-fallback"
                                            style={{ backgroundColor: game.color || '#1674a2' }}
                                        >
                                            {game.gameName?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    {showSkeleton && game.image1 && (
                                        <div className="pack-page-card-skeleton" />
                                    )}
                                </div>

                                {/* <div className="pack-page-card-name-wrap">
                                    <span className="pack-page-card-name">{game.gameName}</span>
                                </div> */}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <div className="game-details-footer">
                <a className="footer-promo-link" target="_blank" rel="noopener noreferrer"
                    href="https://daretoconnectgames.com/">
                    www.daretoconnectgames.com
                </a>
            </div>
        </div>
    );
};

export default PackDetail;