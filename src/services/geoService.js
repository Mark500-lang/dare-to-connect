import { API_CONFIG, buildRequestBody, handleApiResponse, cacheService } from '../config/api';

class GeoService {
    constructor() {
        this.countries = cacheService.getItem('countries') || [];
        this.cities = {};
    }

    async getCountries() {
        // Return cached data if available
        if (this.countries.length > 0) {
            return this.countries;
        }

        try {
            const requestData = buildRequestBody({});

            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COUNTRIES}`, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify(requestData)
            });

            // Pass endpoint name
            const result = await handleApiResponse(response, 'getCountries');
            
            // Handle different response structures
            let countriesList = [];
            
            if (Array.isArray(result)) {
                countriesList = result;
            } else if (result && typeof result === 'object') {
                // Try common field names
                if (Array.isArray(result.countries)) countriesList = result.countries;
                else if (Array.isArray(result.data)) countriesList = result.data;
                else if (Array.isArray(result.list)) countriesList = result.list;
            }
            
            this.countries = countriesList;
            
            // Cache the results
            cacheService.setItem('countries', this.countries, API_CONFIG.CACHE_DURATION.GEO_DATA);
            
            return this.countries;
        } catch (error) {
            console.error('Error fetching countries:', error);
            
            // Return cached data if available
            return this.countries;
        }
    }

    async getCities(countryId) {
        const cacheKey = `cities_${countryId}`;
        
        // Return cached data if available
        if (this.cities[countryId]) {
            return this.cities[countryId];
        }

        try {
            const requestData = buildRequestBody({ countryId });

            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CITIES}`, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify(requestData)
            });

            // Pass endpoint name
            const result = await handleApiResponse(response, 'getCities');
            
            // Handle different response structures
            let citiesList = [];
            
            if (Array.isArray(result)) {
                citiesList = result;
            } else if (result && typeof result === 'object') {
                // Try common field names
                if (Array.isArray(result.cities)) citiesList = result.cities;
                else if (Array.isArray(result.data)) citiesList = result.data;
                else if (Array.isArray(result.list)) citiesList = result.list;
            }
            
            this.cities[countryId] = citiesList;
            
            // Cache the results
            cacheService.setItem(cacheKey, this.cities[countryId], API_CONFIG.CACHE_DURATION.GEO_DATA);
            
            return this.cities[countryId];
        } catch (error) {
            console.error('Error fetching cities:', error);
            
            // Return cached data if available
            const cached = cacheService.getItem(cacheKey);
            if (cached) {
                this.cities[countryId] = cached;
                return cached;
            }
            
            return this.cities[countryId] || [];
        }
    }

    getCachedCountries() {
        return this.countries;
    }

    getCachedCities(countryId) {
        return this.cities[countryId] || [];
    }
}

// Create and export singleton instance
const geoService = new GeoService();
export default geoService;