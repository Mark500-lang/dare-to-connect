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

            const countries = await handleApiResponse(response);
            this.countries = Array.isArray(countries) ? countries : [];
            
            // Cache the results
            cacheService.setItem('countries', this.countries, API_CONFIG.CACHE_DURATION.GEO_DATA);
            
            return this.countries;
        } catch (error) {
            console.error('Error fetching countries:', error);
            
            // Return empty array if error
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

            const cities = await handleApiResponse(response);
            this.cities[countryId] = Array.isArray(cities) ? cities : [];
            
            // Cache the results
            cacheService.setItem(cacheKey, this.cities[countryId], API_CONFIG.CACHE_DURATION.GEO_DATA);
            
            return this.cities[countryId];
        } catch (error) {
            console.error('Error fetching cities:', error);
            
            // Return empty array if error
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