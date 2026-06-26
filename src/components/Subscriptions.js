import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoIosArrowBack } from 'react-icons/io';
import { IoLockClosed, IoCheckmarkCircle } from 'react-icons/io5';
import { CircularProgress, Snackbar, Alert } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import subscriptionService from '../services/subscriptionService';
import './Subscriptions.css';

// ── Pack selector card (small, shown in the horizontal list) ──────────────────
const PackSelectorCard = ({ pack, isSelected, isOwned, isBestValue, onClick }) => (
    <div
        className={`pack-selector-card ${isSelected ? 'selected' : ''} ${isOwned ? 'owned' : ''}`}
        onClick={onClick}
    >
        {isBestValue && <div className="selector-best-value">BEST VALUE</div>}
        {pack.image
            ? <img src={pack.image} alt={pack.packName} className="selector-card-image" />
            : <div className="selector-card-fallback" style={{ backgroundColor: pack.color || '#1674a2' }}>
                {pack.packName?.charAt(0).toUpperCase()}
              </div>
        }
        <p className="selector-card-name">{pack.packName}</p>
        {isOwned && <div className="selector-owned-check"><IoCheckmarkCircle /></div>}
    </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
const Subscriptions = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user } = useAuth();

    // Route state: packId or productId passed from GameLibrary when a locked pack is tapped
    const routeProductId = location.state?.productId ?? null;
    const routePackId    = location.state?.packId    ?? null;

    // ── State ─────────────────────────────────────────────────────────────────
    const [packs,          setPacks]          = useState([]);
    const [ownedPacks,     setOwnedPacks]     = useState([]);
    const [selectedPack,   setSelectedPack]   = useState(null);
    const [prices,         setPrices]         = useState({});     // productId → { priceString }
    const [loading,        setLoading]        = useState(false);
    const [loadingPacks,   setLoadingPacks]   = useState(true);
    const [success,        setSuccess]        = useState(null);
    const [error,          setError]          = useState(null);

    // ── Auth guard ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isAuthenticated) navigate('/login');
    }, [isAuthenticated, navigate]);

    // ── Load packs + prices ───────────────────────────────────────────────────
    useEffect(() => {
        if (isAuthenticated) loadPacksAndPrices();
    }, [isAuthenticated]);

    const loadPacksAndPrices = async () => {
        setLoadingPacks(true);
        try {
            // Init RC so we can read price strings (no-op on web)
            subscriptionService.initializeRevenueCat().catch(() => {});

            const [packsResult, priceStrings] = await Promise.allSettled([
                subscriptionService.getPacks(),
                subscriptionService.getPriceStrings(),
            ]);

            let fetchedPacks  = [];
            let fetchedOwned  = [];
            let fetchedPrices = {};

            if (packsResult.status === 'fulfilled') {
                fetchedPacks = packsResult.value.packs     ?? [];
                fetchedOwned = packsResult.value.ownedPacks ?? [];
            }
            if (priceStrings.status === 'fulfilled') {
                fetchedPrices = priceStrings.value ?? {};
            }

            setPacks(fetchedPacks);
            setOwnedPacks(fetchedOwned);
            setPrices(fetchedPrices);

            // Pre-select the pack that was tapped in the library, or the bundle by default
            const preselect =
                fetchedPacks.find(p => p.productId === routeProductId) ||
                fetchedPacks.find(p => p.id === routePackId) ||
                fetchedPacks.find(p => p.productId === 'com.daretoconnect.pack.bundle') ||
                fetchedPacks[0];

            setSelectedPack(preselect ?? null);

        } catch (err) {
            console.error('Error loading packs:', err);
            setError('Could not load packs. Please check your connection and try again.');
        } finally {
            setLoadingPacks(false);
        }
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    const isOwned      = useCallback((pack) =>
        subscriptionService.isPackOwned(pack?.productId, ownedPacks),
        [ownedPacks]
    );

    const getPriceLabel = (pack) => {
        if (!pack) return '';
        // RC price string (localised, from the store) takes precedence on native
        const rcPrice = prices[pack.productId];
        if (rcPrice?.priceString) return rcPrice.priceString;
        // Fall back to backend price in USD
        if (pack.price) return `$${Number(pack.price).toFixed(2)}`;
        return '';
    };

    const getPackGames = (pack) => pack?.games ?? [];

    // ── Purchase ──────────────────────────────────────────────────────────────
    const handlePurchase = async () => {
        if (!selectedPack || isOwned(selectedPack)) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await subscriptionService.purchasePackage(selectedPack.productId);

            if (result.success) {
                setOwnedPacks(result.ownedPacks ?? []);
                setSuccess(`${selectedPack.packName} unlocked! Head back to the library to play.`);

                // Give the user a moment to read the success message, then go back
                setTimeout(() => navigate('/library'), 2500);
            }

        } catch (err) {
            console.error('Purchase error:', err);

            if (err.message.includes('cancelled') || err.message.includes('canceled')) {
                // User dismissed the native sheet — silent, no error shown
                return;
            }

            let msg = err.message || 'Purchase failed. Please try again.';
            if (msg.includes('not available'))       msg = 'In-app purchases are not available on this device.';
            else if (msg.includes('Network'))        msg = 'No internet connection. Please try again.';
            else if (msg.includes('already owned'))  msg = 'You already own this pack.';

            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // ── Restore ───────────────────────────────────────────────────────────────
    const handleRestore = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await subscriptionService.restorePurchases();
            if (result.success) {
                setOwnedPacks(result.ownedPacks ?? []);
                setSuccess(result.message);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Restore failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    if (!isAuthenticated) {
        return <div className="standalone-page"><div className="subs-loading"><CircularProgress /></div></div>;
    }

    const packOwned       = isOwned(selectedPack);
    const priceLabel      = getPriceLabel(selectedPack);
    const selectedGames   = getPackGames(selectedPack);
    const isBestValue     = selectedPack?.productId === 'com.daretoconnect.pack.bundle';

    // Owned packs as pill badges for the "Your Library" summary
    const ownedPackObjects = packs.filter(p => isOwned(p));

    return (
        <div className="standalone-page">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="game-details-header">
                <IoIosArrowBack
                    className="back-button"
                    color="#000000ff"
                    onClick={() => navigate('/library')}
                    aria-label="Go back"
                />
                <span className="game-details-title">Get Game Packs</span>
            </div>

            <div className="subs-scroll-container">

                {loadingPacks ? (
                    <div className="subs-loading">
                        <CircularProgress size={40} style={{ color: '#1674a2' }} />
                        <p className="subs-loading-text">Loading packs…</p>
                    </div>
                ) : (
                    <>
                        {/* ── Pack selector (horizontal scroll) ───────────────── */}
                        <div className="pack-selector-scroll">
                            {packs.map(pack => (
                                <PackSelectorCard
                                    key={pack.id}
                                    pack={pack}
                                    isSelected={selectedPack?.id === pack.id}
                                    isOwned={isOwned(pack)}
                                    isBestValue={pack.productId === 'com.daretoconnect.pack.bundle'}
                                    onClick={() => setSelectedPack(pack)}
                                />
                            ))}
                        </div>

                        {/* ── Selected pack detail ─────────────────────────────── */}
                        <AnimatePresence mode="wait">
                            {selectedPack && (
                                <motion.div
                                    key={selectedPack.id}
                                    className="pack-detail-card"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {/* Cover image */}
                                    <div className="pack-detail-image-wrap">
                                        {selectedPack.image
                                            ? <img
                                                src={selectedPack.image}
                                                alt={selectedPack.packName}
                                                className="pack-detail-image"
                                              />
                                            : <div
                                                className="pack-detail-fallback"
                                                style={{ backgroundColor: selectedPack.color || '#1674a2' }}
                                              >
                                                {selectedPack.packName?.charAt(0).toUpperCase()}
                                              </div>
                                        }
                                        {isBestValue && (
                                            <div className="pack-detail-best-value">BEST VALUE</div>
                                        )}
                                        {packOwned && (
                                            <div className="pack-detail-owned-overlay">
                                                <IoCheckmarkCircle className="pack-detail-owned-icon" />
                                                <span>Owned</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Pack info */}
                                    <div className="pack-detail-info">
                                        <h2 className="pack-detail-name">{selectedPack.packName}</h2>
                                        {selectedPack.description && (
                                            <p className="pack-detail-description">{selectedPack.description}</p>
                                        )}

                                        {/* Games in this pack */}
                                        {selectedGames.length > 0 && (
                                            <div className="pack-games-list">
                                                <p className="pack-games-label">Includes</p>
                                                {selectedGames.map(game => (
                                                    <div key={game.id} className="pack-game-row">
                                                        <div
                                                            className="pack-game-dot"
                                                            style={{ backgroundColor: game.color || '#1674a2' }}
                                                        />
                                                        <span className="pack-game-name">{game.gameName}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Purchase area ──────────────────────────────── */}
                                    <div className="pack-purchase-area">

                                        {packOwned ? (
                                            <div className="pack-owned-state">
                                                <IoCheckmarkCircle className="owned-check-icon" />
                                                <span>You own this pack</span>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Non-consumable compliance text */}
                                                <p className="purchase-disclosure">
                                                    Payment will be charged to your account at confirmation of purchase.
                                                    This is a one-time purchase. You will not be charged again.
                                                </p>

                                                {/* Primary CTA */}
                                                <motion.button
                                                    className="purchase-btn"
                                                    onClick={handlePurchase}
                                                    disabled={loading}
                                                    whileTap={{ scale: 0.97 }}
                                                    style={{ backgroundColor: selectedPack.color || '#1674a2' }}
                                                >
                                                    {loading ? (
                                                        <CircularProgress size={20} style={{ color: '#fff' }} />
                                                    ) : (
                                                        <>
                                                            <IoLockClosed style={{ marginRight: 8, fontSize: 16 }} />
                                                            Unlock for
                                                            {/* {selectedPack.packName} */}
                                                            {priceLabel ? ` ${priceLabel}` : ''}
                                                        </>
                                                    )}
                                                </motion.button>
                                            </>
                                        )}

                                        {/* Restore */}
                                        <button
                                            className="restore-btn"
                                            onClick={handleRestore}
                                            disabled={loading}
                                        >
                                            Restore Purchases
                                        </button>

                                        {/* Legal links */}
                                        <div className="legal-links">
                                            <a
                                                href="https://daretoconnectgames.com/privacy-policy/"
                                                target="_blank" rel="noreferrer"
                                                className="legal-link"
                                            >
                                                Privacy Policy
                                            </a>
                                            <span className="legal-sep">•</span>
                                            <a
                                                href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                                                target="_blank" rel="noreferrer"
                                                className="legal-link"
                                            >
                                                Terms of Use
                                            </a>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Your Library summary ─────────────────────────────── */}
                        {ownedPackObjects.length > 0 && (
                            <div className="your-library-section">
                                <p className="your-library-label">Your Library</p>
                                <div className="your-library-pills">
                                    {ownedPackObjects.map(pack => (
                                        <span
                                            key={pack.id}
                                            className="library-pill"
                                            style={{ borderColor: pack.color || '#1674a2', color: pack.color || '#1674a2' }}
                                        >
                                            {pack.packName}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                <div className="promo-footer">
                    <a className="footer-promo-link" target="_blank" rel="noopener noreferrer"
                        href="https://daretoconnectgames.com/">
                        www.daretoconnectgames.com
                    </a>
                </div>
            </div>

            {/* ── Snackbars ───────────────────────────────────────────────── */}
            <Snackbar
                open={!!success}
                autoHideDuration={5000}
                onClose={() => setSuccess(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>
            </Snackbar>

            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
            </Snackbar>
        </div>
    );
};

export default Subscriptions;