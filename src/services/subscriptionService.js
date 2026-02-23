// services/subscriptionService.js
import { API_CONFIG, buildRequestBody, handleApiResponse, cacheService } from '../config/api';
import authService from './authService';
import { Purchases } from '@revenuecat/purchases-capacitor';

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
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('mac')) {
            return 'ios';
        } else if (userAgent.includes('android')) {
            return 'android';
        }
        return 'web';
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
    getRevenueCatProductId(packageId) {
        const productMap = {
            1: 'com.daretoconnect.bronze',
            2: 'com.daretoconnect.silver',
            3: 'com.daretoconnect.gold',
            4: 'com.daretoconnect.platinum'
        };
        return productMap[packageId] || null;
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
            // 1. Initialize RevenueCat
            const revenueCatReady = await this.initializeRevenueCat();
            if (!revenueCatReady) {
                throw new Error('In-app purchases not available on this platform.');
            }

            // 2. Get RevenueCat product ID
            const productId = this.getRevenueCatProductId(packageId);
            if (!productId) {
                throw new Error('Product not available for purchase');
            }

            // 3. Get offerings from RevenueCat
            const offerings = await Purchases.getOfferings();
            const currentOffering = offerings?.current;
            
            if (!currentOffering) {
                throw new Error('No subscription offerings available');
            }

            // 4. Find the package to purchase
            const packageToPurchase = currentOffering.availablePackages.find(
                pkg => pkg.identifier === productId
            );

            if (!packageToPurchase) {
                throw new Error('Subscription package not found');
            }

            // 5. GENERATE REFERENCE NUMBER FIRST (Before purchase)
            // This creates a pending payment record in your backend
            const paymentRefData = await this.initiatePayment(packageId);
            if (!paymentRefData || !paymentRefData.ref_no) {
                throw new Error('Failed to generate payment reference');
            }

            // 6. MAKE THE PURCHASE THROUGH REVENUECAT
            console.log('Purchasing package via RevenueCat:', packageToPurchase);
            const purchaseResult = await Purchases.purchasePackage({
                identifier: packageToPurchase.identifier,
                offeringIdentifier: currentOffering.identifier
            });

            if (purchaseResult && purchaseResult.customerInfo) {
                // SUCCESS! Your backend already recorded the payment via initiatePayment
                
                return {
                    success: true,
                    paymentRef: paymentRefData.ref_no,
                    packageId: packageId,
                    customerInfo: purchaseResult.customerInfo
                };
            }

            throw new Error('Purchase failed or was cancelled');

        } catch (error) {
            console.error('Purchase error:', error);
            
            // Handle specific RevenueCat errors
            if (error.code === 'E_USER_CANCELLED') {
                throw new Error('Purchase was cancelled');
            } else if (error.code === 'E_NETWORK_ERROR') {
                throw new Error('Network error. Please check your connection.');
            } else if (error.message?.includes('already purchased') || error.code === 'E_PRODUCT_ALREADY_PURCHASED') {
                throw new Error('You already own this subscription');
            }
            
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
            const requestData = buildRequestBody({ 
                hashedKey: API_CONFIG.API_KEY,
                accessToken 
            });

            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GET_SUBSCRIPTION}`, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify(requestData)
            });

            const result = await handleApiResponse(response, 'getSubscription');
            
            if (result && result.subscription) {
                return result.subscription;
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