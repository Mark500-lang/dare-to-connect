// services/subscriptionService.js
import { API_CONFIG, buildRequestBody, handleApiResponse, cacheService } from '../config/api';
import authService from './authService';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

class SubscriptionService {
    constructor() {
        this.cacheKey = 'subscription_packages';
        this.cacheTimestamp = 'subscription_packages_timestamp';
        this.revenueCatInitialized = false;
        this.platform = null;
    }

    async initializeRevenueCat() {
        if (this.revenueCatInitialized) return true;

        try {
            // Determine platform
            this.platform = this.getPlatform();
            
            // Get API key based on platform
            const apiKey = this.getRevenueCatApiKey();
            if (!apiKey) {
                console.warn('RevenueCat API key not configured for platform:', this.platform);
                return false;
            }

            // Get current user ID for RevenueCat - FIXED: use getUser() not getCurrentUser()
            const currentUser = authService.getUser(); // Changed from getCurrentUser()
            const appUserID = currentUser?.id ? currentUser.id.toString() : null;

            // Configure RevenueCat
            await Purchases.configure({
                apiKey: apiKey,
                appUserID: appUserID,
                observerMode: false,
            });

            // Set debug log level for development
            if (process.env.NODE_ENV === 'development') {
                await Purchases.setLogLevel({ level: "DEBUG" });
            }

            this.revenueCatInitialized = true;
            console.log('RevenueCat initialized successfully for platform:', this.platform);
            return true;
        } catch (error) {
            console.error('RevenueCat initialization failed:', error);
            return false;
        }
    }

    getPlatform() {
        return Capacitor.getPlatform(); // 'ios', 'android', or 'web'
    }

    getRevenueCatApiKey() {
        if (this.platform === 'ios') {
            return process.env.REACT_APP_REVENUECAT_IOS_API_KEY || 
                   (process.env.NODE_ENV === 'development' ? 'appl_development_key_here' : null);
        } else if (this.platform === 'android') {
            return process.env.REACT_APP_REVENUECAT_ANDROID_API_KEY || 
                   (process.env.NODE_ENV === 'development' ? 'goog_development_key_here' : null);
        }
        return null;
    }

    // Map your backend package IDs to RevenueCat product IDs
    getRevenueCatPackageIdentifier(packageId) {
        const packageMap = {
            1: '$rc_weekly',   // com.daretoconnect.bronze - 1 week
            2: '$rc_monthly',  // com.daretoconnect.silver - 1 month
            3: '$rc_annual',   // com.daretoconnect.gold   - 1 year
            4: '$rc_annual',   // fallback
        };
        return packageMap[packageId] || null;
    }

    async getPaymentPackages(forceRefresh = false) {
        // Check cache first
        const cached = cacheService.getItem(this.cacheKey);
        const timestamp = cacheService.getItem(this.cacheTimestamp);
        const cacheAge = timestamp ? Date.now() - timestamp : Infinity;
        const isCacheValid = cacheAge < API_CONFIG.CACHE_DURATION.GAMES;
        
        if (!forceRefresh && cached && cached.length > 0 && isCacheValid) {
            console.log('Returning cached subscription packages');
            return cached;
        }

        try {
            const accessToken = authService.getAccessToken();
            const requestData = buildRequestBody({ 
                hashedKey: API_CONFIG.API_KEY,
                accessToken 
            });

            const response = await fetch(`${API_CONFIG.BASE_URL}/getPaymentPackages`, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify(requestData)
            });

            const result = await handleApiResponse(response, 'getPaymentPackages');
            
            if (result && Array.isArray(result)) {
                cacheService.setItem(this.cacheKey, result, API_CONFIG.CACHE_DURATION.GAMES);
                cacheService.setItem(this.cacheTimestamp, Date.now());
                return result;
            }
            
            return result || [];
        } catch (error) {
            console.error('Error fetching payment packages:', error);
            
            if (cached && cached.length > 0) {
                console.log('Using cached subscription packages after fetch error');
                return cached;
            }
            
            throw error;
        }
    }

    // SINGLE METHOD: Purchase through RevenueCat and record via initiatePayment
    async purchasePackage(packageId) {
        try {
            const revenueCatReady = await this.initializeRevenueCat();
            if (!revenueCatReady) {
                throw new Error('In-app purchases not available on this platform.');
            }

            const offerings = await Purchases.getOfferings();
            const currentOffering = offerings?.current;

            // Debug log — check this in Xcode console during TestFlight
            console.log('RC Offerings:', JSON.stringify({
                currentId: currentOffering?.identifier,
                packages: currentOffering?.availablePackages?.map(p => ({
                    id: p.identifier,
                    productId: p.product?.productIdentifier,
                    price: p.product?.priceString
                }))
            }, null, 2));

            if (!currentOffering?.availablePackages?.length) {
                throw new Error('No subscription offerings available');
            }

            // Get the RC package identifier for this backend package ID
            const rcPackageIdentifier = this.getRevenueCatPackageIdentifier(packageId);
            if (!rcPackageIdentifier) {
                throw new Error('No package mapping found for packageId: ' + packageId);
            }

            // Find the package using RC identifier
            const packageToPurchase = currentOffering.availablePackages.find(
                pkg => pkg.identifier === rcPackageIdentifier
            );

            if (!packageToPurchase) {
                throw new Error(`Package "${rcPackageIdentifier}" not found in offering`);
            }

            // Generate payment reference before purchase
            const paymentRefData = await this.initiatePayment(packageId);
            if (!paymentRefData?.ref_no) {
                throw new Error('Failed to generate payment reference');
            }

            // Correct v12 SDK purchase call
            const purchaseResult = await Purchases.purchasePackage({
                aPackage: packageToPurchase
            });

            if (purchaseResult?.customerInfo) {
                return {
                    success: true,
                    paymentRef: paymentRefData.ref_no,
                    packageId,
                    customerInfo: purchaseResult.customerInfo
                };
            }

            throw new Error('Purchase failed or was cancelled');

        } catch (error) {
            if (error.code === 'E_USER_CANCELLED') throw new Error('Purchase was cancelled');
            if (error.code === 'E_NETWORK_ERROR') throw new Error('Network error. Please check your connection.');
            if (error.code === 'E_PRODUCT_ALREADY_PURCHASED') throw new Error('You already own this subscription');
            throw error;
        }
    }

    // Use existing backend endpoint to initiate payment
    async initiatePayment(packageId) {
        try {
            const accessToken = authService.getAccessToken();
            const requestData = buildRequestBody({
                hashedKey: API_CONFIG.API_KEY,
                accessToken,
                packageId
            });

            const response = await fetch(`${API_CONFIG.BASE_URL}/initiatePayment`, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify(requestData)
            });

            const result = await handleApiResponse(response, 'initiatePayment');
            return result; // Should contain ref_no
        } catch (error) {
            console.error('Error initiating payment:', error);
            throw error;
        }
    }

    // Use existing backend endpoint to get user subscription
    async getUserSubscription() {
        try {
            const accessToken = authService.getAccessToken();
            
            // Debug log to check if token exists
            console.log('Access Token for subscription:', accessToken ? 'Present' : 'Missing');
            
            if (!accessToken) {
                console.error('No access token available');
                return null;
            }

            const requestData = buildRequestBody({ 
                hashedKey: API_CONFIG.API_KEY,
                accessToken // Make sure this is being sent correctly
            });

            console.log('Sending subscription request with token');

            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GET_SUBSCRIPTION}`, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify(requestData)
            });

            const result = await handleApiResponse(response, 'getSubscription');
            
            // Log the raw result to see what's coming back
            console.log('Subscription API result:', result);
            
            // Based on your Subscriptions model, the response structure might be different
            // The checkSubscriptionDetails method returns an array with packageId, packageName, status, fromDate, toDate
            if (result && result.subscription) {
                return result.subscription;
            }
            
            // If the API returns the subscription data directly
            if (result && (result.packageId !== undefined || result.status)) {
                return result;
            }
            
            return null;
        } catch (error) {
            console.error('Error fetching user subscription:', error);
            throw error;
        }
    }

    async restorePurchases() {
        try {
            const revenueCatReady = await this.initializeRevenueCat();
            if (!revenueCatReady) {
                throw new Error('In-app purchases not available on this platform.');
            }

            const customerInfo = await Purchases.restorePurchases();
            
            if (customerInfo && customerInfo.entitlements?.active) {
                // User has active subscriptions in RevenueCat
                const activeEntitlements = Object.values(customerInfo.entitlements.active);
                
                if (activeEntitlements.length > 0) {
                    return {
                        success: true,
                        message: 'Purchases restored successfully! Your subscription is now active.'
                    };
                }
            }
            
            return {
                success: false,
                message: 'No active subscriptions found'
            };

        } catch (error) {
            console.error('Restore purchases error:', error);
            throw error;
        }
    }

    // Add this method for the Subscriptions.js component to call
    async getCustomerInfo() {
        try {
            const revenueCatReady = await this.initializeRevenueCat();
            if (!revenueCatReady) {
                return null;
            }

            const customerInfo = await Purchases.getCustomerInfo();
            return customerInfo;
        } catch (error) {
            console.error('Error getting customer info:', error);
            return null;
        }
    }

    clearCache() {
        cacheService.removeItem(this.cacheKey);
        cacheService.removeItem(this.cacheTimestamp);
    }
}

// Create and export singleton instance
const subscriptionService = new SubscriptionService();
export default subscriptionService;