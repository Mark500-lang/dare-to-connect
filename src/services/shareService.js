class ShareService {
    constructor() {
        this.appLinks = {
            playStore: 'https://play.google.com/store/apps/details?id=com.daretoconnect.games',
            appStore: 'https://apps.apple.com/app/idYOUR_APP_ID', // Replace with your iOS App ID
            appGallery: 'https://appgallery.huawei.com/app/CXXXXXXX', // Replace with your Huawei AppGallery ID
        };
        
        this.shareText = 'Check out Dare to Connect Games! An amazing collection of interactive games to challenge your mind and have fun. Download now:';
    }

    // Get the appropriate app link based on platform
    getAppLink() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        // iOS detection
        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            return this.appLinks.appStore;
        }
        
        // Huawei detection
        if (/huawei/i.test(userAgent) || /harmony/i.test(userAgent)) {
            return this.appLinks.appGallery;
        }
        
        // Default to Play Store for Android and others
        return this.appLinks.playStore;
    }

    // Main share function
    async shareApp() {
        const appLink = this.getAppLink();
        const shareData = {
            title: 'Dare to Connect Games',
            text: `${this.shareText} ${appLink}`,
            url: appLink,
        };

        try {
            // Method 1: Web Share API (iOS, Android, modern browsers)
            if (navigator.share) {
                await navigator.share(shareData);
                return { success: true, method: 'web-share' };
            }

            // Method 2: Capacitor Share Plugin
            if (window.Capacitor && window.Capacitor.Plugins?.Share) {
                await window.Capacitor.Plugins.Share.share(shareData);
                return { success: true, method: 'capacitor-share' };
            }

            // Method 3: Cordova Social Sharing Plugin
            if (window.plugins?.socialsharing) {
                return new Promise((resolve) => {
                    window.plugins.socialsharing.share(
                        shareData.text,
                        shareData.title,
                        null,
                        shareData.url,
                        () => resolve({ success: true, method: 'cordova-social-sharing' }),
                        (error) => resolve({ success: false, method: 'cordova-social-sharing', error })
                    );
                });
            }

            // Method 4: Native bridge for specific platforms
            if (this.isAndroidWebView()) {
                return this.shareViaAndroidBridge(shareData);
            }

            if (this.isIOSWebView()) {
                return this.shareViaIOSBridge(shareData);
            }

            // Fallback: Copy to clipboard
            return this.fallbackShare(shareData);

        } catch (error) {
            console.error('Share error:', error);
            return this.fallbackShare(shareData);
        }
    }

    // Check if running in Android WebView
    isAndroidWebView() {
        return /Android/.test(navigator.userAgent) && /wv/.test(navigator.userAgent);
    }

    // Check if running in iOS WebView
    isIOSWebView() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream && !navigator.standalone;
    }

    // Share via Android Java bridge
    shareViaAndroidBridge(shareData) {
        if (window.Android && window.Android.shareApp) {
            try {
                window.Android.shareApp(shareData.text, shareData.title, shareData.url);
                return { success: true, method: 'android-bridge' };
            } catch (error) {
                console.error('Android bridge error:', error);
            }
        }
        return this.fallbackShare(shareData);
    }

    // Share via iOS Objective-C bridge
    shareViaIOSBridge(shareData) {
        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.shareHandler) {
            try {
                window.webkit.messageHandlers.shareHandler.postMessage(shareData);
                return { success: true, method: 'ios-bridge' };
            } catch (error) {
                console.error('iOS bridge error:', error);
            }
        }
        return this.fallbackShare(shareData);
    }

    // Fallback share method (copy to clipboard)
    fallbackShare(shareData) {
        return new Promise((resolve) => {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(shareData.url)
                    .then(() => {
                        // You can trigger a toast notification here
                        if (window.showToast) {
                            window.showToast('Play Store link copied to clipboard!');
                        } else {
                            alert('Play Store link copied to clipboard!');
                        }
                        resolve({ success: true, method: 'clipboard' });
                    })
                    .catch(() => {
                        window.open(shareData.url, '_blank');
                        resolve({ success: true, method: 'open-new-tab' });
                    });
            } else {
                window.open(shareData.url, '_blank');
                resolve({ success: true, method: 'open-new-tab' });
            }
        });
    }

    // Platform-specific share functions
    shareViaWhatsApp() {
        const appLink = this.getAppLink();
        const message = encodeURIComponent(`${this.shareText} ${appLink}`);
        window.open(`https://wa.me/?text=${message}`, '_blank');
    }

    shareViaFacebook() {
        const appLink = this.getAppLink();
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appLink)}`, '_blank');
    }

    shareViaTwitter() {
        const appLink = this.getAppLink();
        const message = encodeURIComponent(`${this.shareText} ${appLink}`);
        window.open(`https://twitter.com/intent/tweet?text=${message}`, '_blank');
    }
}

// Create and export singleton instance
const shareService = new ShareService();
export default shareService;