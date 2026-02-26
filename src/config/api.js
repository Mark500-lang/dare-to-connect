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
        RECORD_SUBSCRIPTION: '/recordSubscription',
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
export const handleApiResponse = async (response, endpoint = '') => {
    console.log(`API Response [${endpoint}]:`, response.status, response.statusText);
    
    if (!response.ok) {
        // Try to get error details
        let errorMessage = `HTTP Error: ${response.status}`;
        let errorData = null;
        
        try {
            const responseText = await response.text();
            console.error(`API Error [${endpoint}]:`, responseText);
            
            if (responseText) {
                try {
                    errorData = JSON.parse(responseText);
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = responseText;
                }
            }
        } catch (e) {
            console.error(`Could not parse error response [${endpoint}]:`, e);
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
    
    // Get response text first to avoid JSON parsing issues
    const responseText = await response.text();
    
    if (!responseText) {
        console.warn(`Empty response body from [${endpoint}]`);
        return null;
    }
    
    let data;
    try {
        data = JSON.parse(responseText);
        console.log(`API Success [${endpoint}]:`, data);
    } catch (e) {
        console.error(`Failed to parse JSON from [${endpoint}]:`, e, responseText);
        throw new Error('Invalid response format from server');
    }
    
    // Check for success status (case insensitive)
    const status = data.status || data.Status || '';
    const normalizedStatus = status.toString().toLowerCase();
    
    if (normalizedStatus !== 'ok' && normalizedStatus !== 'success') {
        throw new Error(data.message || data.Message || 'Request failed');
    }
    
    // Universal response handler - handles all API structures
    return processApiResponse(data, endpoint);
};

// Helper function to process different API response structures
const processApiResponse = (data, endpoint) => {
    // Special handling for login endpoint
    if (endpoint.includes('login')) {
        return {
            ...(data.result || {}),
            _accessToken: data.message, // Include access token
            _fullResponse: data // Keep full response for debugging
        };
    }
    
    // For GET_QUESTIONS and other array responses
    if (data.result !== undefined && data.result !== null) {
        // If result is an array (questions, games, etc.)
        if (Array.isArray(data.result)) {
            // Return the array directly - NO helper fields on array items
            return data.result;
        }
        
        // If result is an object
        if (typeof data.result === 'object') {
            return {
                ...data.result,
                _fullResponse: data // Only add to objects, not arrays
            };
        }
        
        // Primitive value
        return data.result;
    }
    
    // If data has a data field
    if (data.data !== undefined && data.data !== null) {
        // Handle arrays in data field
        if (Array.isArray(data.data)) {
            return data.data;
        }
        return data.data;
    }
    
    // If data itself is an array (direct array response)
    if (Array.isArray(data)) {
        return data;
    }
    
    // For object responses
    if (typeof data === 'object' && data !== null) {
        // Remove status/message fields if they exist
        const { status, message, Status, Message, code, messages, ...cleanData } = data;
        
        if (Object.keys(cleanData).length > 0) {
            return cleanData;
        }
    }
    
    // Return the entire data object as last resort
    return data;
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