import { API_CONFIG, buildRequestBody, handleApiResponse, cacheService, isOnline } from '../config/api';
import authService from './authService';

class GameService {
    constructor() {
        this.cache = {
            games: cacheService.getItem('games') || [],
            lastFetch: cacheService.getItem('games_timestamp') || null
        };
    }

    async getAllGames(forceRefresh = false) {
        // Check cache first
        const cacheAge = this.cache.lastFetch ? Date.now() - this.cache.lastFetch : Infinity;
        const isCacheValid = cacheAge < API_CONFIG.CACHE_DURATION.GAMES;
        
        if (!forceRefresh && this.cache.games.length > 0 && isCacheValid) {
            console.log('Returning cached games');
            return {
                games: this.cache.games,
                subscription: null
            };
        }

        // Check if offline
        if (!isOnline() && this.cache.games.length > 0) {
            console.log('Offline mode: returning cached games');
            return {
                games: this.cache.games,
                subscription: null,
                isCached: true
            };
        }

        try {
            const accessToken = authService.getAccessToken();
            const requestData = buildRequestBody({ accessToken });

            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GET_GAMES}`, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify(requestData)
            });

            // Pass endpoint name
            const result = await handleApiResponse(response, 'getGames');
            console.log('Games API processed result:', result);
            
            // Handle different response structures
            let gamesList = [];
            let subscriptionInfo = null;
            
            if (result && typeof result === 'object') {
                // Structure 1: result has games and subscription fields
                if (result.games !== undefined) {
                    gamesList = Array.isArray(result.games) ? result.games : [];
                    subscriptionInfo = result.subscription || null;
                } 
                // Structure 2: result is the games array directly
                else if (Array.isArray(result)) {
                    gamesList = result;
                }
                // Structure 3: result has data field
                else if (result.data && Array.isArray(result.data)) {
                    gamesList = result.data;
                }
            }
            
            // Update cache
            this.cache.games = gamesList;
            this.cache.lastFetch = Date.now();
            
            // Save to localStorage
            cacheService.setItem('games', this.cache.games);
            cacheService.setItem('games_timestamp', this.cache.lastFetch);
            
            return {
                games: this.cache.games,
                subscription: subscriptionInfo
            };
        } catch (error) {
            console.error('Error fetching games:', error);
            
            // Return cached data if available
            if (this.cache.games.length > 0) {
                console.log('Using cached games after fetch error');
                return {
                    games: this.cache.games,
                    subscription: null,
                    isCached: true
                };
            }
            
            throw error;
        }
    }

    async getGameQuestions(gameId) {
        try {
            const accessToken = authService.getAccessToken();
            const requestData = buildRequestBody({
                accessToken,
                gameId: parseInt(gameId)
            });

            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GET_QUESTIONS}`, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify(requestData)
            });

            // Pass endpoint name for proper handling
            const questions = await handleApiResponse(response, 'getQuestions');
            console.log('Fetched questions:', questions);
            
            // Ensure we always return an array
            if (!questions) {
                console.warn('No questions returned for game', gameId);
                return [];
            }
            
            if (Array.isArray(questions)) {
                return questions;
            }
            
            // If questions is an object with array property, extract it
            if (questions.questions && Array.isArray(questions.questions)) {
                return questions.questions;
            }
            
            // Last resort: wrap in array
            return [questions];
        } catch (error) {
            console.error('Error fetching game questions:', error);
            
            // Check for cached questions
            const cacheKey = `questions_${gameId}`;
            const cached = cacheService.getItem(cacheKey);
            if (cached) {
                console.log('Using cached questions after fetch error');
                return cached;
            }
            
            throw error;
        }
    }

    getGameById(id) {
        if (!this.cache.games || this.cache.games.length === 0) return null;
        return this.cache.games.find(game => game.id === parseInt(id));
    }

    clearCache() {
        this.cache.games = [];
        this.cache.lastFetch = null;
        cacheService.removeItem('games');
        cacheService.removeItem('games_timestamp');
    }

    getCachedGames() {
        return this.cache.games;
    }
}

// Create and export singleton instance
const gameService = new GameService();
export default gameService;