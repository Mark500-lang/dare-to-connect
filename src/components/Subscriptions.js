import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoIosArrowBack } from 'react-icons/io';
import { IoLockClosed, IoCheckmarkCircle, IoPersonAdd } from 'react-icons/io5';
import { CircularProgress, Snackbar, Alert } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useStatusBar } from '../hooks/useStatusBar';
import subscriptionService from '../services/subscriptionService';
import './Subscriptions.css';

const BUNDLE_ID = 'com.daretoconnect.pack.bundle';
 
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
 
const Subscriptions = () => {
    useStatusBar('light', '#ffffff');
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user } = useAuth();
 
    const routeProductId = location.state?.productId ?? null;
    const routePackId    = location.state?.packId    ?? null;
 
    const [packs,          setPacks]          = useState([]);
    const [ownedPacks,     setOwnedPacks]     = useState([]);
    const [selectedPack,   setSelectedPack]   = useState(null);
    const [prices,         setPrices]         = useState({});
    const [loading,        setLoading]        = useState(false);
    const [loadingPacks,   setLoadingPacks]   = useState(true);
    const [success,        setSuccess]        = useState(null);
    const [error,          setError]          = useState(null);
    // Post-purchase account prompt (for guest purchasers)
    const [showAccountPrompt, setShowAccountPrompt] = useState(false);
    const [purchasedPackName, setPurchasedPackName] = useState('');
 
    const [packImageLoaded, setPackImageLoaded] = useState({});

    // ── NO AUTH GUARD — Apple requires purchases work without login ────────────
 
    useEffect(() => {
        if (!selectedPack) return;
    
        const id = selectedPack.id;
    
        // Already tracked — don't reset
        if (packImageLoaded[id] === true) return;
    
        if (selectedPack.image) {
            // Check if the browser already has this image in its HTTP cache.
            // Create a temporary Image object — if complete is true immediately,
            // the browser served it from cache and onLoad will never fire.
            const probe = new window.Image();
            probe.src = selectedPack.image;
    
            if (probe.complete && probe.naturalWidth > 0) {
                // Already cached — mark loaded immediately, no skeleton needed
                setPackImageLoaded(prev => ({ ...prev, [id]: true }));
            } else {
                // Not cached — show skeleton, wait for onLoad
                setPackImageLoaded(prev => ({ ...prev, [id]: false }));
            }
        } else {
            // No image at all — skip skeleton
            setPackImageLoaded(prev => ({ ...prev, [id]: true }));
        }
    }, [selectedPack?.id]); // only re-run when the selected pack actually changes
    
    const handlePackImageLoad = (packId) => {
        setPackImageLoaded(prev => ({ ...prev, [packId]: true }));
    };

    useEffect(() => {
        loadPacksAndPrices();
    }, []);
 
    // Re-check ownership if user logs in during this session
    useEffect(() => {
        if (isAuthenticated && packs.length > 0) {
            loadPacksAndPrices();
        }
    }, [isAuthenticated]);
 
    const loadPacksAndPrices = async () => {
        setLoadingPacks(true);
        try {
            subscriptionService.initializeRevenueCat().catch(() => {});
 
            const [packsResult, priceStrings] = await Promise.allSettled([
                subscriptionService.getPacks(),
                subscriptionService.getPriceStrings(),
            ]);
 
            let fetchedPacks  = [];
            let fetchedOwned  = [];
            let fetchedPrices = {};
 
            if (packsResult.status === 'fulfilled') {
                fetchedPacks  = packsResult.value.packs      ?? [];
                fetchedOwned  = packsResult.value.ownedPacks ?? [];
            }
            if (priceStrings.status === 'fulfilled') {
                fetchedPrices = priceStrings.value ?? {};
            }
 
            // Also check locally stored guest purchases
            const localOwned = getLocalOwnedPacks();
            const allOwned   = [...new Set([...fetchedOwned, ...localOwned])];
 
            setPacks(fetchedPacks);
            setOwnedPacks(allOwned);
            setPrices(fetchedPrices);
 
            const preselect =
                fetchedPacks.find(p => p.productId === routeProductId) ||
                fetchedPacks.find(p => p.id === routePackId) ||
                fetchedPacks.find(p => p.productId === BUNDLE_ID) ||
                fetchedPacks[0];
 
            setSelectedPack(preselect ?? null);
        } catch (err) {
            console.error('Error loading packs:', err);
            setError('Could not load packs. Please check your connection.');
        } finally {
            setLoadingPacks(false);
        }
    };
 
    // ── Local storage fallback so guest purchases are never lost ─────────────
    // Stored by RC's anonymous user ID so restore works even without an account
    const getLocalOwnedPacks = () => {
        try {
            const stored = localStorage.getItem('dtc_owned_packs');
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    };
 
    const saveLocalOwnedPack = (productId) => {
        try {
            const existing = getLocalOwnedPacks();
            const updated  = [...new Set([...existing, productId])];
            localStorage.setItem('dtc_owned_packs', JSON.stringify(updated));
        } catch (e) {
            console.warn('Could not save purchase locally:', e);
        }
    };
 
    const isOwned = useCallback((pack) => {
        if (!pack) return false;
        return subscriptionService.isPackOwned(pack.productId, ownedPacks);
    }, [ownedPacks]);
 
    const getPriceLabel = (pack) => {
        if (!pack) return '';
        const rcPrice = prices[pack.productId];
        if (rcPrice?.priceString) return rcPrice.priceString;
        if (pack.price) return `$${Number(pack.price).toFixed(2)}`;
        return '';
    };
 
    // ── Purchase — works for both guests and logged-in users ─────────────────
    const handlePurchase = async () => {
        if (!selectedPack || isOwned(selectedPack)) return;
 
        setLoading(true);
        setError(null);
        setSuccess(null);
 
        try {
            const result = await subscriptionService.purchasePackage(selectedPack.productId);
 
            if (result.success) {
                // Save locally immediately — never lose this even if backend fails
                saveLocalOwnedPack(selectedPack.productId);
                if (selectedPack.productId === BUNDLE_ID) {
                    // Bundle owns everything — save all
                    packs.forEach(p => saveLocalOwnedPack(p.productId));
                }
 
                setOwnedPacks(result.ownedPacks ?? []);
                setPurchasedPackName(selectedPack.packName);
 
                if (!isAuthenticated) {
                    // Guest purchaser — show account prompt instead of just navigating away
                    setShowAccountPrompt(true);
                } else {
                    setSuccess(`${selectedPack.packName} unlocked! Head back to play.`);
                    setTimeout(() => navigate('/library'), 2500);
                }
            }
        } catch (err) {
            if (err.message.includes('cancelled') || err.message.includes('canceled')) return;
 
            let msg = err.message || 'Purchase failed. Please try again.';
            if (msg.includes('not configured') || msg.includes('API key')) {
                msg = 'Purchases are not available in this version. Please update the app.';
            } else if (msg.includes('No products found')) {
                msg = 'Products could not be loaded. Make sure you are signed into a sandbox account in Settings.';
            } else if (msg.includes('connection')) {
                msg = 'No internet connection. Please try again.';
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };
 
    const handleRestore = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await subscriptionService.restorePurchases();
            if (result.success) {
                // Merge restored with local
                result.ownedPacks?.forEach(id => saveLocalOwnedPack(id));
                setOwnedPacks(prev => [...new Set([...prev, ...(result.ownedPacks ?? [])])]);
                setSuccess(result.message);
            } else {
                // Also check local storage before giving up
                const local = getLocalOwnedPacks();
                if (local.length > 0) {
                    setOwnedPacks(prev => [...new Set([...prev, ...local])]);
                    setSuccess(`${local.length} pack(s) restored from this device.`);
                } else {
                    setError(result.message);
                }
            }
        } catch (err) {
            setError('Restore failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };
 
    const packOwned     = isOwned(selectedPack);
    const priceLabel    = getPriceLabel(selectedPack);
    const selectedGames = selectedPack?.games ?? [];
    const isBestValue   = selectedPack?.productId === BUNDLE_ID;
    const ownedPackObjects = packs.filter(p => isOwned(p));
 
    return (
        <div className="library-container">
 
            {/* Header */}
            <div className="library-header">
                <IoIosArrowBack
                    className="back-button-sub"
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
                        {/* Pack selector */}
                        <div className="pack-selector-scroll">
                            {packs.map(pack => (
                                <PackSelectorCard
                                    key={pack.id}
                                    pack={pack}
                                    isSelected={selectedPack?.id === pack.id}
                                    isOwned={isOwned(pack)}
                                    isBestValue={pack.productId === BUNDLE_ID}
                                    onClick={() => setSelectedPack(pack)}
                                />
                            ))}
                        </div>
 
                        {/* Selected pack detail */}
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
                                        {selectedPack.image ? (
                                            <>
                                                {!packImageLoaded[selectedPack.id] && (
                                                    <div className="pack-detail-image-skeleton" />
                                                )}
                                                <img
                                                    src={selectedPack.image}
                                                    alt={selectedPack.packName}
                                                    className={`pack-detail-image ${packImageLoaded[selectedPack.id] ? 'loaded' : ''}`}
                                                    onLoad={() => handlePackImageLoad(selectedPack.id)}
                                                    onError={() => handlePackImageLoad(selectedPack.id)} // stop skeleton even on error
                                                />
                                            </>
                                        ) : (
                                            <div className="pack-detail-fallback" style={{ backgroundColor: selectedPack.color || '#1674a2' }}>
                                                {selectedPack.packName?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        {isBestValue && <div className="pack-detail-best-value">BEST VALUE</div>}
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
                                        {selectedGames.length > 0 && (
                                            <div className="pack-games-list">
                                                <p className="pack-games-label">Includes</p>
                                                {selectedGames.map(game => (
                                                    <div key={game.id} className="pack-game-row">
                                                        <div className="pack-game-dot" style={{ backgroundColor: game.color || '#1674a2' }} />
                                                        <span className="pack-game-name">{game.gameName}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
 
                                    {/* Purchase area */}
                                    <div className="pack-purchase-area">
                                        {packOwned ? (
                                            <div className="pack-owned-state">
                                                <IoCheckmarkCircle className="owned-check-icon" />
                                                <span>You own this pack</span>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="purchase-disclosure">
                                                    Payment will be charged to your Apple ID at confirmation.
                                                    This is a one-time purchase, you will not be charged again.
                                                </p>
                                                <motion.button
                                                    className="purchase-btn"
                                                    onClick={handlePurchase}
                                                    disabled={loading}
                                                    whileTap={{ scale: 0.97 }}
                                                    style={{ backgroundColor: selectedPack.color || '#1674a2' }}
                                                >
                                                    {loading
                                                        ? <CircularProgress size={20} style={{ color: '#fff' }} />
                                                        : <>
                                                            <IoLockClosed style={{ marginRight: 8, fontSize: 16 }} />
                                                            Unlock {priceLabel ? ` ${priceLabel}` : ''}
                                                          </>
                                                    }
                                                </motion.button>
                                            </>
                                        )}
 
                                        <button className="restore-btn" onClick={handleRestore} disabled={loading}>
                                            Restore Purchases
                                        </button>
 
                                        <div className="legal-links">
                                            <a href="https://daretoconnectgames.com/privacy-policy/" target="_blank" rel="noreferrer" className="legal-link">
                                                Privacy Policy
                                            </a>
                                            <span className="legal-sep">•</span>
                                            <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noreferrer" className="legal-link">
                                                Terms of Use
                                            </a>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
 
                        {/* Your Library */}
                        {ownedPackObjects.length > 0 && (
                            <div className="your-library-section">
                                <p className="your-library-label">Your Library</p>
                                <div className="your-library-pills">
                                    {ownedPackObjects.map(pack => (
                                        <span key={pack.id} className="library-pill"
                                            style={{ borderColor: pack.color || '#1674a2', color: pack.color || '#1674a2' }}>
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
 
            {/* ── Post-purchase account prompt for guest users ── */}
            <AnimatePresence>
                {showAccountPrompt && (
                    <motion.div className="modal-backdrop"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="account-prompt-card"
                            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
 
                            <IoCheckmarkCircle className="account-prompt-check" />
                            <h2 className="account-prompt-title">
                                {purchasedPackName} Unlocked!
                            </h2>
                            <p className="account-prompt-body">
                                Create an account to access your purchase on any device
                                and make sure it's never lost. You can also skip this and
                                play right away, your purchase is saved on this device.
                            </p>
 
                            <button
                                className="account-prompt-btn-primary"
                                onClick={() => navigate('/register', {
                                    state: { from: '/library', purchaseComplete: true }
                                })}
                            >
                                <IoPersonAdd style={{ marginRight: 8 }} />
                                Create Free Account
                            </button>
 
                            <button
                                className="account-prompt-btn-skip"
                                onClick={() => { setShowAccountPrompt(false); navigate('/library'); }}
                            >
                                Play Now Without Account
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
 
            {/* Snackbars */}
            <Snackbar open={!!success} autoHideDuration={5000} onClose={() => setSuccess(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>
            </Snackbar>
            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
            </Snackbar>
        </div>
    );
};
 
export default Subscriptions;