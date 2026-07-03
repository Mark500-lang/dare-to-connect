import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

const APP_LINKS = {
    ios:     'https://apps.apple.com/app/dare-to-connect/id6741878124',
    android: 'https://play.google.com/store/apps/details?id=daretoconnect.app.mobile',
    default: 'https://daretoconnectgames.com/',
};

const getAppLink = () => {
    const platform = Capacitor.getPlatform();
    return APP_LINKS[platform] ?? APP_LINKS.default;
};

const shareService = {
    /**
     * Opens the native share sheet on iOS and Android via Capacitor.
     * Falls back to clipboard copy on web.
     * Returns { shared: true } or { copied: true } or { error }.
     */
    async shareApp() {
        const link    = getAppLink();
        const message = `Check out Dare to Connect — a fun card game app for friends, couples and more!`;

        if (Capacitor.isNativePlatform()) {
            try {
                await Share.share({
                    title:         'Dare to Connect',
                    text:          message,
                    url:           link,
                    dialogTitle:   'Share Dare to Connect',
                });
                return { shared: true };
            } catch (err) {
                // User dismissed the share sheet — not an error
                if (err.message?.includes('cancelled') || err.message?.includes('canceled')) {
                    return { cancelled: true };
                }
                console.error('[Share] Native share failed:', err);
                return { error: err.message };
            }
        }

        // Web fallback — try navigator.share first, then clipboard
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Dare to Connect', text: message, url: link });
                return { shared: true };
            } catch (err) {
                if (err.name === 'AbortError') return { cancelled: true };
            }
        }

        // Last resort — clipboard
        try {
            await navigator.clipboard.writeText(link);
            return { copied: true };
        } catch (err) {
            return { error: 'Could not copy link. Please copy it manually.' };
        }
    },

    /**
     * Share to a specific platform by opening a URL.
     * Used by the manual share buttons (WhatsApp, Facebook, etc.)
     * Does NOT navigate away — opens in external browser.
     */
    async shareToPlatform(platform) {
        const link    = getAppLink();
        const message = `Check out Dare to Connect — a fun card game app for friends, couples and more! ${link}`;

        const urls = {
            whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
            twitter:  `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
        };

        const url = urls[platform];
        if (!url) return { error: 'Unknown platform' };

        if (Capacitor.isNativePlatform()) {
            // Use Capacitor Browser to open externally without leaving the app
            const { Browser } = await import('@capacitor/browser');
            await Browser.open({ url });
        } else {
            window.open(url, '_blank', 'noopener,noreferrer');
        }

        return { shared: true };
    },

    getAppLink,
};

export default shareService;