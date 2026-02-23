import { API_CONFIG, buildRequestBody, handleApiResponse } from '../config/api';
import authService from './authService';

class SupportService {
    async submitSupportRequest(formData) {
        try {
            const accessToken = authService.getAccessToken();
            const user = authService.getUser();
            
            const requestData = buildRequestBody({
                accessToken,
                fullName: formData.fullName || `${user?.firstName} ${user?.lastName}`,
                mobileNumber: formData.mobileNumber || user?.mobileNo,
                message: formData.message,
                email: user?.email,
                type: 'support_request'
            });

            const response = await fetch(`${API_CONFIG.BASE_URL}/submitSupport`, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify(requestData)
            });

            const result = await handleApiResponse(response, 'submitSupport');
            return result;
        } catch (error) {
            console.error('Error submitting support request:', error);
            throw error;
        }
    }
}

const supportService = new SupportService();
export default supportService;