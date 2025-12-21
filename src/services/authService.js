import { API_CONFIG, buildRequestBody, handleApiResponse, cacheService } from '../config/api';

class AuthService {
    constructor() {
        this.initialize();
    }

    initialize() {
        if (typeof window === 'undefined') return;
        
        try {
            this.accessToken = localStorage.getItem('accessToken');
            this.user = JSON.parse(localStorage.getItem('user') || 'null');
        } catch (error) {
            console.error('Auth initialization error:', error);
            this.accessToken = null;
            this.user = null;
        }
    }

    async login(email, password) {
        try {
            console.log('Attempting login for:', email);
            
            const requestData = buildRequestBody({
                email,
                password
                // Note: accessToken is NOT included here - it's returned by the server
            });

            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify(requestData)
            });

            const result = await handleApiResponse(response);
            console.log('Login successful, result:', result);
            
            // IMPORTANT: Your backend returns accessToken as a string in the message field
            // Check if we have a proper accessToken in the result
            let accessToken = null;
            
            if (result && typeof result === 'string') {
                // If result is a string, it's the accessToken
                accessToken = result;
            } else if (result && result.message && typeof result.message === 'string') {
                // If result has a message field containing the token
                accessToken = result.message;
            } else if (result && result.accessToken) {
                // If result has an accessToken field
                accessToken = result.accessToken;
            }
            
            if (!accessToken) {
                throw new Error('No access token received from server');
            }
            
            // Save token
            this.accessToken = accessToken;
            localStorage.setItem('accessToken', accessToken);
            
            // Try to get user profile
            let userData = null;
            try {
                userData = await this.getProfile();
            } catch (profileError) {
                console.warn('Could not fetch profile immediately:', profileError);
                // If we have user data in result, use it
                if (result && result.id) {
                    userData = result;
                }
            }
            
            // Save user data
            this.user = userData;
            if (userData) {
                localStorage.setItem('user', JSON.stringify(userData));
            }
            
            return {
                accessToken,
                user: userData
            };
            
        } catch (error) {
            console.error('Login service error:', error);
            
            // Provide specific error messages
            if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                throw new Error('Network error. Please check your internet connection.');
            } else if (error.message.includes('Server error')) {
                throw new Error('Server error. Please try again later.');
            } else if (error.message.includes('Wrong email address or password')) {
                throw new Error('Invalid email or password. Please try again.');
            } else if (error.message.includes('Email address not found')) {
                throw new Error('Email not found. Please sign up first.');
            } else if (error.message.includes('account is not verified')) {
                throw new Error('Account not verified. Please check your email for verification link.');
            } else {
                throw error;
            }
        }
    }

    async register(userData) {
        try {
            const requestData = buildRequestBody({
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                mobileNo: userData.phone,
                password: userData.password,
                countryId: parseInt(userData.countryId),
                cityId: parseInt(userData.cityId)
            });

            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REGISTER}`, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify(requestData)
            });

            const result = await handleApiResponse(response);
            console.log('Registration successful, result:', result);
            
            return {
                success: true,
                message: result.message || 'Registration successful. Please check your email for verification.',
                data: result
            };
        } catch (error) {
            console.error('Registration service error:', error);
            throw error;
        }
    }

    async getProfile() {
        if (!this.accessToken) {
            return null;
        }

        try {
            const requestData = buildRequestBody({
                accessToken: this.accessToken
            });

            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GET_PROFILE}`, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify(requestData)
            });

            const userData = await handleApiResponse(response);
            
            // Save user data
            this.user = userData;
            localStorage.setItem('user', JSON.stringify(userData));
            
            return userData;
        } catch (error) {
            console.error('Get profile error:', error);
            
            // If token is invalid, logout
            if (error.message.includes('401') || error.message.includes('Session expired')) {
                this.logout();
            }
            
            throw error;
        }
    }

    async forgotPassword(email) {
        try {
            const requestData = buildRequestBody({ email });

            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FORGOT_PASSWORD}`, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify(requestData)
            });

            const result = await handleApiResponse(response);
            
            return {
                success: true,
                message: result.message || 'Reset instructions sent to your email.'
            };
        } catch (error) {
            console.error('Forgot password error:', error);
            throw error;
        }
    }

    logout() {
        this.accessToken = null;
        this.user = null;
        
        if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
        }
        
        // Clear cache
        cacheService.clear();
    }

    isAuthenticated() {
        return !!this.accessToken;
    }

    getAccessToken() {
        return this.accessToken;
    }

    getUser() {
        return this.user;
    }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;