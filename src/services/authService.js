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
            });

            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify(requestData)
            });

            // Pass endpoint name for intelligent response handling
            const result = await handleApiResponse(response, 'login');
            console.log('Login processed result:', result);
            
            // Now result contains everything we need:
            // - User data in result properties (firstName, lastName, etc.)
            // - Access token in result._accessToken (if login endpoint)
            // - Full response in result._fullResponse (for debugging)
            
            let accessToken = null;
            let userData = null;
            
            // Extract access token
            if (result._accessToken) {
                accessToken = result._accessToken;
            } else if (result.accessToken) {
                accessToken = result.accessToken;
            } else if (result.token) {
                accessToken = result.token;
            }
            
            if (!accessToken) {
                throw new Error('No access token received from server');
            }
            
            // Extract user data (remove helper fields)
            const { _accessToken, _fullResponse, ...cleanUserData } = result;
            userData = Object.keys(cleanUserData).length > 0 ? cleanUserData : null;
            
            // Save token
            this.accessToken = accessToken;
            localStorage.setItem('accessToken', accessToken);
            
            // If user data is minimal, fetch full profile
            if (!userData || !userData.id) {
                try {
                    const fullProfile = await this.getProfile();
                    userData = { ...userData, ...fullProfile };
                } catch (profileError) {
                    console.warn('Could not fetch full profile:', profileError);
                    // Use what we have
                    if (email && !userData.email) {
                        userData = { ...userData, email };
                    }
                }
            }
            
            // Save user data
            this.user = userData;
            localStorage.setItem('user', JSON.stringify(userData));
            
            return {
                accessToken,
                user: userData
            };
            
        } catch (error) {
            console.error('Login service error:', error);
            
            // Provide user-friendly error messages
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

            // Pass endpoint name
            const userData = await handleApiResponse(response, 'getProfile');
            
            // Clean up any helper fields
            const { _accessToken, _fullResponse, ...cleanUserData } = userData || {};
            
            // Check if profile has photo field, if not add default
            const finalUserData = cleanUserData || {};
            if (finalUserData && !finalUserData.profilePhoto) {
                finalUserData.profilePhoto = '/default-profile.png';
            }
            
            // Save updated user data
            this.user = finalUserData;
            localStorage.setItem('user', JSON.stringify(finalUserData));
            
            return finalUserData;
        } catch (error) {
            console.error('Get profile error:', error);
            
            // If token is invalid, logout
            if (error.message.includes('401') || error.message.includes('Session expired')) {
                this.logout();
            }
            
            throw error;
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

    async getFullProfile() {
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
            
            // Check if profile has photo field, if not add default
            if (userData && !userData.profilePhoto) {
                userData.profilePhoto = '/default-profile.png'; // Default image path
            }
            
            // Save updated user data
            this.user = userData;
            localStorage.setItem('user', JSON.stringify(userData));
            
            return userData;
        } catch (error) {
            console.error('Get full profile error:', error);
            throw error;
        }
    }

    // Add this method to update profile
    async updateProfile(profileData) {
        if (!this.accessToken) {
            throw new Error('Not authenticated');
        }

        try {
            const requestData = buildRequestBody({
                accessToken: this.accessToken,
                ...profileData
            });

            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPDATE_PROFILE}`, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify(requestData)
            });

            const result = await handleApiResponse(response);
            
            // Refresh user data
            await this.getFullProfile();
            
            return {
                success: true,
                message: result.message || 'Profile updated successfully'
            };
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }

    // Add this method to change password
    async changePassword(currentPassword, newPassword) {
        if (!this.accessToken) {
            throw new Error('Not authenticated');
        }

        try {
            const requestData = buildRequestBody({
                accessToken: this.accessToken,
                currentPassword,
                newPassword
            });

            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHANGE_PASSWORD}`, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify(requestData)
            });

            const result = await handleApiResponse(response);
            
            return {
                success: true,
                message: result.message || 'Password changed successfully'
            };
        } catch (error) {
            console.error('Change password error:', error);
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