import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';
import gameService from '../services/gameService';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [games, setGames] = useState([]);
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        setLoading(true);
        
        try {
            // Check if user is already logged in
            if (authService.isAuthenticated()) {
                const userData = authService.getUser();
                setUser(userData);
                
                // Load games
                await refreshGames();
            } else {
                // Load public games for non-logged in users
                await refreshGames();
            }
        } catch (err) {
            console.error('Auth initialization error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const refreshGames = async (forceRefresh = false) => {
        try {
            const gamesData = await gameService.getAllGames(forceRefresh);
            setGames(gamesData.games || []);
            setSubscription(gamesData.subscription || null);
            return gamesData;
        } catch (err) {
            console.error('Error refreshing games:', err);
            setError(err.message);
            
            // Try to use cached games
            const cachedGames = gameService.getCachedGames();
            if (cachedGames && cachedGames.length > 0) {
                setGames(cachedGames);
            }
            
            throw err;
        }
    };

    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await authService.login(email, password);
            setUser(result.user);
            
            // Refresh games after login
            await refreshGames(true);
            
            return result;
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await authService.register(userData);
            return result;
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const forgotPassword = async (email) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await authService.forgotPassword(email);
            return result;
        } catch (err) {
            console.error('Forgot password error:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        authService.logout();
        gameService.clearCache();
        setUser(null);
        setGames([]);
        setSubscription(null);
        setError(null);
    };

    const value = {
        user,
        games,
        subscription,
        loading,
        error,
        login,
        register,
        forgotPassword,
        logout,
        refreshGames,
        isAuthenticated: authService.isAuthenticated()
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};