export const API_CONFIG = {
    BASE_URL: 'https://admin.daretoconnectgames.com/api',
    API_KEY: process.env.REACT_APP_API_KEY || 'daretoconnect_games_api_key_2024',
    
    ENDPOINTS: {
        LOGIN: '/login',
        REGISTER: '/register',
        GET_GAMES: '/getGames',
        GET_QUESTIONS: '/getQuestions',
        GET_PROFILE: '/getProfile',
        GET_SUBSCRIPTION: '/getSubscription',
        INITIATE_PAYMENT: '/initiatePayment',
        COUNTRIES: '/getCountries',
        CITIES: '/getCities',
        UPDATE_PROFILE: '/updateProfile',
        CHANGE_PASSWORD: '/changePassword',
        FORGOT_PASSWORD: '/forgotPass'
    },
    
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    
    // Caching durations in milliseconds
    CACHE_DURATION: {
        GAMES: 5 * 60 * 1000, // 5 minutes
        QUESTIONS: 10 * 60 * 1000, // 10 minutes per game
        GEO_DATA: 24 * 60 * 60 * 1000 // 24 hours
    }
};

// Simple request builder
export const buildRequestBody = (data) => ({
    hashedKey: API_CONFIG.API_KEY,
    ...data
});

// Enhanced response handler
export const handleApiResponse = async (response) => {
    console.log('API Response Status:', response.status, response.statusText, response);
    
    if (!response.ok) {
        // Try to get error details
        let errorMessage = `HTTP Error: ${response.status}`;
        try {
            const errorData = await response.json();
            console.error('API Error Details:', errorData);
            errorMessage = errorData.message || errorMessage;
        } catch (e) {
            console.error('Could not parse error response:', e);
        }
        
        // Provide user-friendly messages
        switch (response.status) {
            case 400:
                throw new Error(`Bad request: ${errorMessage}`);
            case 401:
                throw new Error('Session expired. Please login again.');
            case 403:
                throw new Error('Access denied.');
            case 404:
                throw new Error('Resource not found.');
            case 422:
                throw new Error(`Validation error: ${errorMessage}`);
            case 429:
                throw new Error('Too many requests. Please try again later.');
            case 500:
                throw new Error(`Server error: ${errorMessage}`);
            default:
                throw new Error(`API Error: ${response.status}`);
        }
    }
    
    const data = await response.json();
    console.log('API Response Data:', data);
    
    // Check for success status
    if (data.status !== 'Ok' && data.status !== 'ok') {
        throw new Error(data.message || 'Request failed');
    }
    
    return data.result !== null ? data.result : data;
};

// Simple cache service
export const cacheService = {
    setItem: (key, data, duration = API_CONFIG.CACHE_DURATION.GAMES) => {
        if (typeof window === 'undefined') return false;
        
        try {
            const cacheData = {
                data,
                timestamp: Date.now(),
                expiry: Date.now() + duration
            };
            localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    },
    
    getItem: (key) => {
        if (typeof window === 'undefined') return null;
        
        try {
            const cached = localStorage.getItem(`cache_${key}`);
            if (!cached) return null;
            
            const cacheData = JSON.parse(cached);
            
            if (cacheData.expiry && Date.now() > cacheData.expiry) {
                localStorage.removeItem(`cache_${key}`);
                return null;
            }
            
            return cacheData.data;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    },
    
    removeItem: (key) => {
        if (typeof window === 'undefined') return false;
        
        try {
            localStorage.removeItem(`cache_${key}`);
            return true;
        } catch (error) {
            console.error('Cache remove error:', error);
            return false;
        }
    },
    
    clear: () => {
        if (typeof window === 'undefined') return false;
        
        try {
            // Remove only cache items
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('cache_')) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
            
            return true;
        } catch (error) {
            console.error('Cache clear error:', error);
            return false;
        }
    }
};

// Network detection
export const isOnline = () => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
};