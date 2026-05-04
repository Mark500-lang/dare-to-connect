import { API_CONFIG, buildRequestBody, cacheService } from '../config/api';
import authService from './authService';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { debugLog } from '../components/DebugLogger';

const RC_PACKAGE_MAP = {
    1: '$rc_weekly',
    2: '$rc_monthly',
    3: '$rc_annual',
    4: '$rc_annual',
};

const PRODUCT_ID_MAP = {
    1: 'com.daretoconnect.bronze',
    2: 'com.daretoconnect.silver',
    3: 'com.daretoconnect.gold',
    4: 'com.daretoconnect.gold',
};

// ── Sara Stories pattern: single entitlement ID ──────────────────────────────
// Check your RevenueCat dashboard for the exact entitlement identifier
const ENTITLEMENT_ID = 'Dare to Connect Premium';

class SubscriptionService {
    constructor() {
        this.cacheKey              = 'subscription_packages';
        this.cacheTimestamp        = 'subscription_packages_timestamp';
        this.revenueCatInitialized = false;
        this.platform              = null;
    }

    getPlatform() { return Capacitor.getPlatform(); }
    isNative()    { return Capacitor.isNativePlatform(); }

    getRevenueCatApiKey() {
        const platform = this.getPlatform();
        if (platform === 'ios')     return process.env.REACT_APP_REVENUECAT_IOS_API_KEY     || null;
        if (platform === 'android') return process.env.REACT_APP_REVENUECAT_ANDROID_API_KEY || null;
        return null;
    }

    // ── Force any RC result into a plain JS object ────────────────────────────
    // This is the fix for "o is not a function" — Android Capacitor bridge
    // returns Java proxy objects. JSON round-trip converts them to plain JS.
    _plain(obj) {
        try   { return JSON.parse(JSON.stringify(obj ?? {})); }
        catch { return {}; }
    }

    // ── Sara Stories pattern: check entitlement by ID ─────────────────────────
    _hasPremium(customerInfo) {
        try {
            const plain  = this._plain(customerInfo);
            const active = plain?.entitlements?.active ?? {};
            debugLog('info', '[RC] Active entitlement keys:', Object.keys(active));

            // Check named entitlement first (Sara Stories primary check)
            if (active[ENTITLEMENT_ID]) return true;

            // Fallback: any active entitlement at all (Sara Stories fallback)
            return Object.keys(active).length > 0;
        } catch (e) {
            debugLog('warn', '[RC] _hasPremium error (non-fatal):', e.message);
            return false;
        }
    }

    _getFirstEntitlement(customerInfo) {
        try {
            const plain  = this._plain(customerInfo);
            const active = plain?.entitlements?.active ?? {};
            const values = Object.values(active);
            return values.length > 0 ? values[0] : null;
        } catch (e) {
            debugLog('warn', '[RC] _getFirstEntitlement (non-fatal):', e.message);
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INIT
    // ─────────────────────────────────────────────────────────────────────────
    async initializeRevenueCat() {
        if (this.revenueCatInitialized) return true;

        if (!this.isNative()) {
            debugLog('warn', '[RC] Non-native platform — skipping RevenueCat init.');
            this.revenueCatInitialized = true;
            return true;
        }

        try {
            this.platform  = this.getPlatform();
            const apiKey   = this.getRevenueCatApiKey();

            if (!apiKey) {
                debugLog('error', '[RC] No API key for platform:', this.platform);
                return false;
            }

            if (process.env.NODE_ENV !== 'production') {
                await Purchases.setLogLevel({ level: 'DEBUG' });
            }

            await Purchases.configure({ apiKey });
            debugLog('info', '[RC] Configured for platform:', this.platform);

            // ── Sara Stories pattern exactly ──────────────────────────────
            // Log in with user account ID so entitlements are tied to the
            // same account across reinstalls — same as Sara Stories logIn call
            const currentUser = authService.getUser();
            if (currentUser?.id) {
                await Purchases.logIn({ appUserID: String(currentUser.id) });
                debugLog('info', '[RC] Logged in as user ID:', currentUser.id);
            } else {
                debugLog('warn', '[RC] No user found — RC using anonymous ID');
            }

            // Load offerings and log them
            await this._logOfferings();

            this.revenueCatInitialized = true;
            debugLog('success', '[RC] Initialization complete');
            return true;

        } catch (error) {
            debugLog('error', '[RC] Init failed:', error.message);
            this.revenueCatInitialized = true;
            return false;
        }
    }

    async _logOfferings() {
        try {
            const { current } = await Purchases.getOfferings();
            if (!current) {
                debugLog('warn', '[RC] No current offering returned');
                return;
            }
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
    // PACKAGES
    // ─────────────────────────────────────────────────────────────────────────
    async getPaymentPackages(forceRefresh = false) {
        const cached = cacheService.getItem(this.cacheKey);
        const ts     = cacheService.getItem(this.cacheTimestamp);
        const age    = ts ? Date.now() - ts : Infinity;
        const valid  = age < API_CONFIG.CACHE_DURATION.GAMES;

        if (!forceRefresh && cached?.length > 0 && valid) return cached;

        try {
            const accessToken = authService.getAccessToken();
            const response    = await fetch(`${API_CONFIG.BASE_URL}/getPaymentPackages`, {
                method:  'POST',
                headers: API_CONFIG.HEADERS,
                body:    JSON.stringify(buildRequestBody({ accessToken })),
            });

            const data = JSON.parse(await response.text());
            if (data.status?.toLowerCase() !== 'ok') throw new Error(data.message || 'Failed to fetch packages');

            const result = Array.isArray(data.result) ? data.result : [];
            cacheService.setItem(this.cacheKey, result, API_CONFIG.CACHE_DURATION.GAMES);
            cacheService.setItem(this.cacheTimestamp, Date.now());
            return result;

        } catch (error) {
            debugLog('error', '[RC] getPaymentPackages:', error.message);
            if (cached?.length > 0) return cached;
            throw error;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PURCHASE  —  Sara Stories pattern
    // ─────────────────────────────────────────────────────────────────────────
    async purchasePackage(packageId) {
        if (!this.isNative()) {
            throw new Error('In-app purchases are only available on iOS and Android.');
        }

        debugLog('info', '[RC] Starting purchase for packageId:', packageId);

        const ready = await this.initializeRevenueCat();
        if (!ready) throw new Error('Payment system could not be initialised.');

        // ── 1. Fetch offerings ────────────────────────────────────────────
        const { current } = await Purchases.getOfferings();
        if (!current) throw new Error('No subscription offerings available.');

        const allPackages = Object.values(current.availablePackages);
        debugLog('info', '[RC] Packages available:', allPackages.map(p => ({
            rcId:      p.identifier,
            productId: p.product?.productIdentifier,
            price:     p.product?.priceString,
        })));

        // ── 2. Match package ──────────────────────────────────────────────
        let packageToPurchase =
            allPackages.find(p => p.identifier === RC_PACKAGE_MAP[packageId]) ||
            allPackages.find(p => p.product?.productIdentifier === PRODUCT_ID_MAP[packageId]) ||
            allPackages[0];

        if (!packageToPurchase) throw new Error('No products available for purchase.');

        debugLog('info', '[RC] Selected package:', {
            rcId:      packageToPurchase.identifier,
            productId: packageToPurchase.product?.productIdentifier,
            price:     packageToPurchase.product?.priceString,
        });

        // ── 3. Create backend payment reference ───────────────────────────
        const paymentRefData = await this.initiatePayment(packageId);
        if (!paymentRefData?.ref_no) throw new Error('Failed to generate payment reference.');
        debugLog('info', '[RC] Payment ref created:', paymentRefData.ref_no);

        // ── 4. Trigger native purchase sheet ─────────────────────────────
        let customerInfo;

        try {
            debugLog('info', '[RC] Calling Purchases.purchasePackage...');
            const rawResult = await Purchases.purchasePackage({ aPackage: packageToPurchase });

            // Log the EXACT raw shape — this tells us everything
            debugLog('info', '[RC] Raw result:', this._plain(rawResult));

            // Sara Stories pattern: destructure customerInfo directly
            // _plain() forces Android proxy → plain JS object
            const plain  = this._plain(rawResult);
            customerInfo = plain.customerInfo ?? plain;

            debugLog('info', '[RC] customerInfo:', customerInfo);

        } catch (purchaseError) {
            const msg  = (purchaseError.message || '').toLowerCase();
            const code = purchaseError.code;

            debugLog('warn', '[RC] purchasePackage threw:', {
                message: purchaseError.message,
                code,
                userCancelled: msg.includes('cancelled') || msg.includes('canceled') || code === '1' || code === 1
            });

            if (msg.includes('cancelled') || msg.includes('canceled') || code === '1' || code === 1) {
                throw new Error('Purchase was cancelled');
            }

            // Android: already owned → fetch customerInfo and treat as success
            // Sara Stories handles this exact case
            if (msg.includes('already owned') || msg.includes('already purchased')) {
                debugLog('info', '[RC] Already owned — fetching customerInfo.');
                const raw = await Purchases.getCustomerInfo();
                customerInfo = this._plain(raw?.customerInfo ?? raw);
            } else {
                throw purchaseError;
            }
        }

        // ── 5. Sara Stories entitlement check ────────────────────────────
        const hasPremium = this._hasPremium(customerInfo);
        debugLog(hasPremium ? 'success' : 'warn',
            '[RC] hasPremium:', hasPremium,
            '| Entitlements:', this._plain(customerInfo?.entitlements?.active)
        );

        if (!hasPremium) {
            // Sara Stories: log warning but still proceed
            // RC can have propagation delay on first purchase
            debugLog('warn', '[RC] No active entitlement yet — may be propagation delay. Proceeding with record.');
        }

        // ── 6. Record in backend ──────────────────────────────────────────
        await this.recordSubscription(packageId, paymentRefData.ref_no, customerInfo);

        debugLog('success', '[RC] Purchase flow complete for packageId:', packageId);
        return { success: true, paymentRef: paymentRefData.ref_no, packageId, customerInfo };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INITIATE PAYMENT
    // ─────────────────────────────────────────────────────────────────────────
    async initiatePayment(packageId) {
        const accessToken = authService.getAccessToken();
        if (!accessToken) throw new Error('Not logged in.');

        debugLog('info', '[RC] initiatePayment for packageId:', packageId);

        const response = await fetch(`${API_CONFIG.BASE_URL}/initiatePayment`, {
            method:  'POST',
            headers: API_CONFIG.HEADERS,
            body:    JSON.stringify({
                hashedKey:  API_CONFIG.API_KEY,
                accessToken,
                packageId:  parseInt(packageId, 10),
            }),
        });

        const text = await response.text();
        debugLog('info', '[RC] initiatePayment response:', text);

        let data;
        try   { data = JSON.parse(text); }
        catch { throw new Error('Invalid server response from initiatePayment.'); }

        if (data.status?.toLowerCase() !== 'ok') throw new Error(data.message || 'Payment initiation failed.');

        const result = data.result;
        if (result?.ref_no)             return result;
        if (result?.refNo)              return { ref_no: result.refNo };
        if (typeof result === 'string') return { ref_no: result };

        throw new Error('No payment reference returned from backend.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RECORD SUBSCRIPTION
    // ─────────────────────────────────────────────────────────────────────────
    async recordSubscription(packageId, refNo, customerInfo) {
        try {
            const accessToken   = authService.getAccessToken();
            const entitlement   = this._getFirstEntitlement(customerInfo);
            const expirationDate    = entitlement?.expirationDate ?? entitlement?.expiration_date ?? null;
            const productIdentifier = entitlement?.productIdentifier ?? entitlement?.product_identifier ?? '';

            debugLog('info', '[RC] recordSubscription payload:', {
                packageId, refNo, productIdentifier, expirationDate
            });

            const response = await fetch(`${API_CONFIG.BASE_URL}/recordSubscription`, {
                method:  'POST',
                headers: API_CONFIG.HEADERS,
                body:    JSON.stringify({
                    hashedKey:             API_CONFIG.API_KEY,
                    accessToken,
                    packageId:             parseInt(packageId, 10),
                    refNo,
                    transactionId:         productIdentifier,
                    originalTransactionId: productIdentifier,
                    expiryDate:            expirationDate,
                }),
            });

            const text = await response.text();
            debugLog('info', '[RC] recordSubscription response:', text);

            let data;
            try   { data = JSON.parse(text); }
            catch { return null; }

            if (data.status?.toLowerCase() !== 'ok') {
                debugLog('error', '[RC] recordSubscription backend error:', data.message);
            } else {
                debugLog('success', '[RC] Subscription recorded in backend successfully');
            }

            return data;

        } catch (error) {
            // Non-fatal — purchase already succeeded at RC level
            debugLog('error', '[RC] recordSubscription failed (non-fatal):', error.message);
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET USER SUBSCRIPTION
    // ─────────────────────────────────────────────────────────────────────────
    async getUserSubscription() {
        try {
            const accessToken = authService.getAccessToken();
            if (!accessToken) return null;

            const response = await fetch(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GET_SUBSCRIPTION}`,
                {
                    method:  'POST',
                    headers: API_CONFIG.HEADERS,
                    body:    JSON.stringify(buildRequestBody({ accessToken })),
                }
            );

            const data = JSON.parse(await response.text());
            if (data.status?.toLowerCase() !== 'ok') return null;

            const result = data.result;
            if (result?.subscription)                              return result.subscription;
            if (result?.packageId !== undefined || result?.status) return result;
            return null;

        } catch (error) {
            debugLog('error', '[RC] getUserSubscription:', error.message);
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESTORE  —  Sara Stories pattern exactly
    // ─────────────────────────────────────────────────────────────────────────
    async restorePurchases() {
        if (!this.isNative()) throw new Error('Restore is only available on iOS and Android.');

        debugLog('info', '[RC] Starting restore purchases...');

        const ready = await this.initializeRevenueCat();
        if (!ready) throw new Error('Payment system could not be initialised.');

        const rawResult  = await Purchases.restorePurchases();
        debugLog('info', '[RC] Raw restore result:', this._plain(rawResult));

        const customerInfo = this._plain(rawResult?.customerInfo ?? rawResult);
        const hasPremium   = this._hasPremium(customerInfo);

        debugLog(hasPremium ? 'success' : 'warn', '[RC] Restore hasPremium:', hasPremium);

        if (hasPremium) {
            return { success: true, message: 'Purchases restored successfully! Your subscription is now active.' };
        }

        return { success: false, message: 'No active subscriptions found for this account.' };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET CUSTOMER INFO
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

    clearCache() {
        cacheService.removeItem(this.cacheKey);
        cacheService.removeItem(this.cacheTimestamp);
    }
}

const subscriptionService = new SubscriptionService();
export default subscriptionService;