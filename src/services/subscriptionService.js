import { API_CONFIG, buildRequestBody, cacheService } from '../config/api';
import authService from './authService';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { debugLog } from '../components/DebugLogger';

// ── RC package identifier → our productId ────────────────────────────────────
// These must match the Package Identifiers you created in RC Offerings exactly.
const RC_PACKAGE_TO_PRODUCT = {
    'pack_social':   'com.daretoconnect.pack.social',
    'pack_couples':  'com.daretoconnect.pack.couples',
    'pack_wellness': 'com.daretoconnect.pack.wellness',
    'pack_career':   'com.daretoconnect.pack.career',
    'pack_bundle':   'com.daretoconnect.pack.bundle',
};

// ── Bundle expands to all pack entitlements ───────────────────────────────────
const BUNDLE_PRODUCT_ID = 'com.daretoconnect.pack.bundle';
const ALL_PACK_PRODUCT_IDS = [
    'com.daretoconnect.pack.social',
    'com.daretoconnect.pack.couples',
    'com.daretoconnect.pack.wellness',
    'com.daretoconnect.pack.career',
    'com.daretoconnect.pack.bundle',
];

let _rcConfigured = false;
let _rcInitPromise = null; // prevents concurrent init calls

class SubscriptionService {
    constructor() {
        this.packsCache            = 'packs_data';          // { packs, timestamp }
        this.ownedPacksCache       = 'owned_packs';         // string[]
        this.revenueCatInitialized = false;
        this.platform              = null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PLATFORM HELPERS
    // ─────────────────────────────────────────────────────────────────────────
    getPlatform() { return Capacitor.getPlatform(); }
    isNative()    { return Capacitor.isNativePlatform(); }

    getRevenueCatApiKey() {
        const platform = this.getPlatform();
        if (platform === 'ios')     return process.env.REACT_APP_REVENUECAT_IOS_API_KEY     || null;
        if (platform === 'android') return process.env.REACT_APP_REVENUECAT_ANDROID_API_KEY || null;
        return null;
    }

    // ── Force any RC result into a plain JS object ────────────────────────────
    // Android Capacitor bridge returns Java proxy objects.
    // JSON round-trip converts them to plain JS — essential for entitlement reads.
    _plain(obj) {
        try   { return JSON.parse(JSON.stringify(obj ?? {})); }
        catch { return {}; }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ENTITLEMENT HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns array of owned productId strings from RC customerInfo.
     * If bundle is owned, all pack productIds are included.
     */
    getOwnedPacks(customerInfo) {
        try {
            const plain  = this._plain(customerInfo);
            const active = plain?.entitlements?.active ?? {};
            const keys   = Object.keys(active); // e.g. ['com.daretoconnect.pack.social']

            debugLog('info', '[RC] Active entitlement keys:', keys);

            if (keys.length === 0) return [];

            // If bundle is owned, expand to all packs
            if (keys.includes(BUNDLE_PRODUCT_ID)) {
                return [...ALL_PACK_PRODUCT_IDS];
            }

            return keys;
        } catch (e) {
            debugLog('warn', '[RC] getOwnedPacks error:', e.message);
            return [];
        }
    }

    /**
     * Returns true if a specific pack productId is owned.
     * Bundle ownership counts as owning everything.
     */
    isPackOwned(productId, ownedPacks) {
        if (!Array.isArray(ownedPacks)) return false;
        return ownedPacks.includes(productId) || ownedPacks.includes(BUNDLE_PRODUCT_ID);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REVENUECAT INIT
    // ─────────────────────────────────────────────────────────────────────────
    async initializeRevenueCat() {
        // Already configured — return immediately
        if (_rcConfigured) return true;

        // If init is already in progress, wait for it rather than starting a second one
        // This is critical on iOS where concurrent StoreKit configure calls cause errors
        if (_rcInitPromise) return _rcInitPromise;

        if (!this.isNative()) {
            _rcConfigured = true;
            return true;
        }

        _rcInitPromise = this._doInitialize();
        const result   = await _rcInitPromise;
        _rcInitPromise = null;
        return result;
    }

    async _doInitialize() {
        try {
            this.platform = this.getPlatform();
            const apiKey  = this.getRevenueCatApiKey();

            if (!apiKey) {
                debugLog('error', '[RC] No API key for platform:', this.platform);
                return false;
            }

            // Debug logging only in non-production
            if (process.env.NODE_ENV !== 'production') {
                await Purchases.setLogLevel({ level: 'DEBUG' });
            }

            await Purchases.configure({ apiKey });
            // Set flag BEFORE logIn — a logIn failure must not block future purchase attempts
            _rcConfigured = true;
            debugLog('info', '[RC] Configured for platform:', this.platform);

            // Log in with user account ID if available
            const currentUser = authService.getUser();
            if (currentUser?.id) {
                try {
                    await Purchases.logIn({ appUserID: String(currentUser.id) });
                    debugLog('info', '[RC] Logged in as user ID:', currentUser.id);
                } catch (loginErr) {
                    // Non-fatal — anonymous purchases still work
                    debugLog('warn', '[RC] logIn failed (non-fatal):', loginErr.message);
                }
            } else {
                debugLog('warn', '[RC] No user — RC using anonymous ID');
            }

            await this._logOfferings();
            debugLog('success', '[RC] Initialization complete');
            return true;

        } catch (error) {
            debugLog('error', '[RC] Init failed:', error.message);
            // Do NOT set _rcConfigured = true on genuine failure
            // so the next call retries rather than assuming success
            _rcInitPromise = null;
            return false;
        }
    }

    async _logOfferings() {
        try {
            const { current } = await Purchases.getOfferings();
            if (!current) { debugLog('warn', '[RC] No current offering'); return; }
            const packages = Object.values(current.availablePackages);
            debugLog('info', '[RC] Offerings loaded:', packages.map(p => ({
                rcId:      p.identifier,
                productId: p.product?.productIdentifier,
                price:     p.product?.priceString,
                title:     p.product?.title,
            })));
        } catch (e) {
            debugLog('warn', '[RC] _logOfferings failed:', e.message);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET PACKS — backend packs + owned status in one call
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Fetches packs from backend (/getPacks) and merges with RC ownership.
     * Returns { packs: Pack[], ownedPacks: string[] }
     *
     * Cache strategy:
     *   - Pack list cached for 5 minutes (same as games)
     *   - ownedPacks cached for 5 minutes, cleared immediately after any purchase
     *   - forceRefresh = true bypasses both caches
     */
    async getPacks(forceRefresh = false) {
        const CACHE_KEY = this.packsCache;
        const CACHE_TTL = API_CONFIG.CACHE_DURATION.GAMES; // 5 min

        if (!forceRefresh) {
            const cached = cacheService.getItem(CACHE_KEY);
            if (cached) {
                debugLog('info', '[Packs] Returning cached packs');
                return cached;
            }
        }

        try {
            const accessToken = authService.getAccessToken();
            const response    = await fetch(`${API_CONFIG.BASE_URL}/getPacks`, {
                method:  'POST',
                headers: API_CONFIG.HEADERS,
                body:    JSON.stringify(buildRequestBody({ accessToken })),
            });

            const data = JSON.parse(await response.text());
            if (data.status?.toLowerCase() !== 'ok') {
                throw new Error(data.message || 'Failed to fetch packs');
            }

            const packs         = data.result?.packs         ?? [];
            // Backend returns owned packs for logged-in users
            const backendOwned  = data.result?.ownedProducts ?? [];

            // Also check RC directly on native for the authoritative source
            let rcOwned = [];
            if (this.isNative()) {
                const customerInfo = await this.getCustomerInfo();
                rcOwned = this.getOwnedPacks(customerInfo);
                debugLog('info', '[Packs] RC owned packs:', rcOwned);
            }

            // Merge: union of backend + RC (belt and braces)
            const ownedPacks = [...new Set([...backendOwned, ...rcOwned])];

            // Expand bundle if present
            const finalOwned = ownedPacks.includes(BUNDLE_PRODUCT_ID)
                ? [...ALL_PACK_PRODUCT_IDS]
                : ownedPacks;

            const result = { packs, ownedPacks: finalOwned };
            cacheService.setItem(CACHE_KEY, result, CACHE_TTL);

            debugLog('info', '[Packs] Loaded', packs.length, 'packs. Owned:', finalOwned);
            return result;

        } catch (error) {
            debugLog('error', '[Packs] getPacks failed:', error.message);
            // Return stale cache rather than blank screen
            const stale = cacheService.getItem(CACHE_KEY);
            if (stale) return stale;
            throw error;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PURCHASE FLOW
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Purchase a pack by its productId string (e.g. 'com.daretoconnect.pack.social').
     *
     * Flow:
     *   1. Init RC
     *   2. Find the matching RC package in the current offering
     *   3. Create a backend payment reference
     *   4. Trigger the native purchase sheet
     *   5. Record the purchase in the backend
     *   6. Clear pack cache so the library refreshes ownership
     *   7. Return { success, productId, ownedPacks }
     */
    async purchasePackage(productId) {
        if (!this.isNative()) {
            throw new Error('In-app purchases are only available on the iOS or Android app.');
        }

        debugLog('info', '[RC] Starting purchase for productId:', productId);

        // Wait for init — may already be in progress from AuthContext startup
        const ready = await this.initializeRevenueCat();
        if (!ready) {
            const apiKey = this.getRevenueCatApiKey();
            if (!apiKey) {
                throw new Error(
                    'RevenueCat API key is missing from this build. ' +
                    'Please update the app to the latest version.'
                );
            }
            throw new Error(
                'Payment system could not be initialised. ' +
                'Please close the app fully, reopen it, and try again.'
            );
        }

        // Fetch offerings — surface real error rather than swallowing it
        let current;
        try {
            const offerings = await Purchases.getOfferings();
            current = offerings.current;
            debugLog('info', '[RC] Offerings received:', current ? 'yes' : 'empty');
        } catch (offeringsErr) {
            debugLog('error', '[RC] getOfferings failed:', offeringsErr.message);
            throw new Error(
                'Could not reach the App Store. ' +
                'Please check your internet connection and Apple ID, then try again. ' +
                `(${offeringsErr.message})`
            );
        }

        if (!current || Object.keys(current.availablePackages ?? {}).length === 0) {
            throw new Error(
                'No products found in the App Store. ' +
                'Please ensure you are signed into your Apple ID under Settings → App Store.'
            );
        }
    
        const allPackages = Object.values(current.availablePackages);
        debugLog('info', '[RC] Available packages:', allPackages.map(p => ({
            rcId:      p.identifier,
            productId: p.product?.productIdentifier,
            price:     p.product?.priceString,
        })));
    
        const packageToPurchase =
            allPackages.find(p => p.product?.productIdentifier === productId) ||
            allPackages.find(p => RC_PACKAGE_TO_PRODUCT[p.identifier] === productId);
    
        if (!packageToPurchase) {
            throw new Error(
                `Product "${productId}" not found in current offering. ` +
                'Verify the product ID matches App Store Connect exactly.'
            );
        }
    
        // Create backend payment reference
        const paymentRefData = await this.initiatePayment(productId);
        if (!paymentRefData?.ref_no) throw new Error('Failed to generate payment reference.');
    
        // Native purchase sheet
        let customerInfo;
        try {
            const rawResult  = await Purchases.purchasePackage({ aPackage: packageToPurchase });
            const plain      = this._plain(rawResult);
            customerInfo     = plain.customerInfo ?? plain;
        } catch (purchaseError) {
            const msg  = (purchaseError.message || '').toLowerCase();
            const code = purchaseError.code;
    
            if (msg.includes('cancelled') || msg.includes('canceled') || code === '1' || code === 1) {
                throw new Error('Purchase was cancelled.');
            }
            if (msg.includes('already owned') || msg.includes('already purchased')) {
                const raw = await Purchases.getCustomerInfo();
                customerInfo = this._plain(raw?.customerInfo ?? raw);
            } else {
                throw purchaseError;
            }
        }
    
        const ownedPacks = this.getOwnedPacks(customerInfo);
        await this.recordSubscription(productId, paymentRefData.ref_no, customerInfo);
        this.clearPacksCache();
    
        debugLog('success', '[RC] Purchase complete. Owned packs:', ownedPacks);
        return { success: true, productId, ownedPacks };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INITIATE PAYMENT  (creates a ref_no in the backend payments table)
    // ─────────────────────────────────────────────────────────────────────────
    async initiatePayment(productId) {
        // accessToken is optional — guest purchases are allowed
        // Backend handles null accessToken gracefully
        const accessToken = authService.getAccessToken() ?? null;
    
        const packIdMap = {
            'com.daretoconnect.pack.social':   1,
            'com.daretoconnect.pack.couples':  2,
            'com.daretoconnect.pack.wellness': 3,
            'com.daretoconnect.pack.career':   4,
            'com.daretoconnect.pack.bundle':   5,
        };
        const packageId = packIdMap[productId];
        if (!packageId) throw new Error(`Unknown productId: ${productId}`);
    
        debugLog('info', '[RC] initiatePayment — productId:', productId, 'packageId:', packageId, 'guest:', !accessToken);
    
        const response = await fetch(`${API_CONFIG.BASE_URL}/initiatePayment`, {
            method:  'POST',
            headers: API_CONFIG.HEADERS,
            body:    JSON.stringify({
                hashedKey:   API_CONFIG.API_KEY,
                accessToken, // null for guests — backend accepts this now
                packageId,
            }),
        });
    
        const text = await response.text();
        debugLog('info', '[RC] initiatePayment response:', text);
    
        let data;
        try   { data = JSON.parse(text); }
        catch { throw new Error('Invalid response from server.'); }
    
        if (data.status?.toLowerCase() !== 'ok') {
            throw new Error(data.message || 'Payment initiation failed.');
        }
    
        const result = data.result;
        if (result?.ref_no)             return result;
        if (result?.refNo)              return { ref_no: result.refNo };
        if (typeof result === 'string') return { ref_no: result };
    
        throw new Error('No payment reference returned from backend.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RECORD SUBSCRIPTION  (tells backend the purchase is confirmed)
    // ─────────────────────────────────────────────────────────────────────────
    async recordSubscription(productId, refNo, customerInfo) {
        try {
            const accessToken = authService.getAccessToken();

            const packIdMap = {
                'com.daretoconnect.pack.social':   1,
                'com.daretoconnect.pack.couples':  2,
                'com.daretoconnect.pack.wellness': 3,
                'com.daretoconnect.pack.career':   4,
                'com.daretoconnect.pack.bundle':   5,
            };
            const packageId = packIdMap[productId] ?? 1;

            // Non-consumable: no expiry date → backend stores toDate as NULL = permanent
            const payload = {
                hashedKey:  API_CONFIG.API_KEY,
                accessToken,
                packageId,
                productId,   // backend uses this to set the productId column
                refNo,
                expiryDate:  null,  // explicitly null = non-consumable, never expires
            };

            debugLog('info', '[RC] recordSubscription payload:', payload);

            const response = await fetch(`${API_CONFIG.BASE_URL}/recordSubscription`, {
                method:  'POST',
                headers: API_CONFIG.HEADERS,
                body:    JSON.stringify(payload),
            });

            const text = await response.text();
            debugLog('info', '[RC] recordSubscription response:', text);

            let data;
            try   { data = JSON.parse(text); }
            catch { return null; }

            if (data.status?.toLowerCase() !== 'ok') {
                debugLog('error', '[RC] recordSubscription backend error:', data.message);
            } else {
                debugLog('success', '[RC] Subscription recorded. Owned:', data.result);
            }

            return data;

        } catch (error) {
            // Non-fatal — purchase already confirmed at RC level
            debugLog('error', '[RC] recordSubscription failed (non-fatal):', error.message);
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESTORE PURCHASES
    // ─────────────────────────────────────────────────────────────────────────
    async restorePurchases() {
        if (!this.isNative()) throw new Error('Restore is only available on iOS and Android.');

        debugLog('info', '[RC] Starting restore purchases...');

        const ready = await this.initializeRevenueCat();
        if (!ready) throw new Error('Payment system could not be initialised.');

        const rawResult    = await Purchases.restorePurchases();
        const customerInfo = this._plain(rawResult?.customerInfo ?? rawResult);
        const ownedPacks   = this.getOwnedPacks(customerInfo);

        debugLog('info', '[RC] Restore result — owned packs:', ownedPacks);

        if (ownedPacks.length > 0) {
            // Re-record all restored packs in the backend
            for (const productId of ownedPacks) {
                const refNo = `restore_${productId}_${Date.now()}`;
                await this.recordSubscription(productId, refNo, customerInfo);
            }

            // Clear cache so library reflects restored state
            this.clearPacksCache();

            return {
                success:    true,
                ownedPacks,
                message:    `${ownedPacks.length} pack${ownedPacks.length > 1 ? 's' : ''} restored successfully!`,
            };
        }

        return { success: false, ownedPacks: [], message: 'No previous purchases found for this account.' };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET CUSTOMER INFO  (direct RC query)
    // ─────────────────────────────────────────────────────────────────────────
    async getCustomerInfo() {
        try {
            const ready = await this.initializeRevenueCat();
            if (!ready) return null;
            const raw = await Purchases.getCustomerInfo();
            return this._plain(raw?.customerInfo ?? raw);
        } catch (error) {
            debugLog('error', '[RC] getCustomerInfo:', error.message);
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET PRICE STRINGS from RC offerings (so Subscriptions.jsx shows real prices)
    // ─────────────────────────────────────────────────────────────────────────
    async getPriceStrings() {
        if (!this.isNative()) return {};

        try {
            const ready = await this.initializeRevenueCat();
            if (!ready) return {};

            const { current } = await Purchases.getOfferings();
            if (!current) return {};

            const prices = {};
            for (const pkg of Object.values(current.availablePackages)) {
                const productId = pkg.product?.productIdentifier;
                if (productId) {
                    prices[productId] = {
                        priceString:   pkg.product.priceString,
                        price:         pkg.product.price,
                        currencyCode:  pkg.product.currencyCode,
                    };
                }
            }
            debugLog('info', '[RC] Price strings:', prices);
            return prices;
        } catch (e) {
            debugLog('warn', '[RC] getPriceStrings failed:', e.message);
            return {};
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CACHE MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────
    clearPacksCache() {
        cacheService.removeItem(this.packsCache);
        debugLog('info', '[Cache] Packs cache cleared');
    }

    clearAllCaches() {
        this.clearPacksCache();
    }
}

const subscriptionService = new SubscriptionService();
export default subscriptionService;