import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaWhatsapp, FaFacebook, FaTwitter, FaCopy, FaShareAlt } from 'react-icons/fa';
import { IoIosArrowBack } from 'react-icons/io';
import { Alert, Snackbar } from '@mui/material';
import { useStatusBar } from '../hooks/useStatusBar';
import shareService from '../services/shareService';
import './TellAFriend.css';

const TellAFriend = () => {
    const navigate = useNavigate();
    useStatusBar('dark', '#ffffff');

    const [toast, setToast] = useState(null); // { message, severity }

    const appLink = shareService.getAppLink();

    // ── Native share sheet (iOS + Android) ───────────────────────────────────
    const handleNativeShare = async () => {
        const result = await shareService.shareApp();
        if (result.copied)    setToast({ message: 'Link copied to clipboard!', severity: 'success' });
        else if (result.error) setToast({ message: result.error,                severity: 'error' });
        // cancelled → do nothing, user just dismissed the sheet
    };

    // ── Platform-specific share buttons ──────────────────────────────────────
    const handlePlatformShare = async (platform) => {
        const result = await shareService.shareToPlatform(platform);
        if (result.error) setToast({ message: result.error, severity: 'error' });
    };

    // ── Copy link ─────────────────────────────────────────────────────────────
    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(appLink);
            setToast({ message: 'Link copied!', severity: 'success' });
        } catch {
            setToast({ message: 'Could not copy. Please copy the link manually.', severity: 'error' });
        }
    };

    const platforms = [
        { id: 'whatsapp', label: 'WhatsApp', icon: <FaWhatsapp />, color: '#25D366' },
        { id: 'facebook', label: 'Facebook', icon: <FaFacebook />, color: '#1877F2' },
        { id: 'twitter',  label: 'Twitter',  icon: <FaTwitter />,  color: '#1DA1F2' },
    ];

    return (
        <div className="standalone-page">
            <div className="game-details-header">
                <IoIosArrowBack
                    className="back-button"
                    color="#000000ff"
                    onClick={() => navigate(-1)}
                    aria-label="Go back"
                />
                <span className="game-details-title">Tell a Friend</span>
            </div>

            <div className="tell-friend-content">

                {/* Hero */}
                <div className="tell-friend-hero">
                    <div className="tell-friend-emoji">🎉</div>
                    <h2 className="tell-friend-heading">Share the Fun!</h2>
                    <p className="tell-friend-sub">
                        Know someone who'd love a good conversation game?
                        Share Dare to Connect with them.
                    </p>
                </div>

                {/* Link row */}
                <div className="tell-friend-link-row">
                    <span className="tell-friend-link-text" title={appLink}>
                        {appLink.replace('https://', '')}
                    </span>
                    <button className="tell-friend-copy-btn" onClick={handleCopyLink} aria-label="Copy link">
                        <FaCopy />
                    </button>
                </div>

                {/* Primary share button — native sheet */}
                <button className="tell-friend-share-btn" onClick={handleNativeShare}>
                    <FaShareAlt style={{ marginRight: 8 }} />
                    Share Now
                </button>

                {/* Platform buttons */}
                <p className="tell-friend-or">or share directly via</p>
                <div className="tell-friend-platforms">
                    {platforms.map(p => (
                        <button
                            key={p.id}
                            className="tell-friend-platform-btn"
                            style={{ '--platform-color': p.color }}
                            onClick={() => handlePlatformShare(p.id)}
                            aria-label={`Share on ${p.label}`}
                        >
                            <span className="tell-friend-platform-icon">{p.icon}</span>
                            <span className="tell-friend-platform-label">{p.label}</span>
                        </button>
                    ))}
                </div>

            </div>

            <Snackbar
                open={!!toast}
                autoHideDuration={3000}
                onClose={() => setToast(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={toast?.severity ?? 'success'} onClose={() => setToast(null)}>
                    {toast?.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default TellAFriend;