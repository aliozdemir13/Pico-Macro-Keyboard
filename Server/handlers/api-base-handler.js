const axios = require('axios');

class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async request(method, endpoint, params = {}, data = null) {
        const url = `${endpoint}`;
        console.log('test debug: '+ method + endpoint + params )
        try {
            let response;
            switch (method.toLowerCase()) {
                case 'get':
                    response = await axios.get(url, { params });
                    break;
                case 'post':
                    response = await axios.post(url, data);
                    break;
                case 'put':
                    response = await axios.put(url, data);
                    break;
                case 'delete':
                    response = await axios.delete(url);
                    break;
                default:
                    throw new Error(`Unsupported method: ${method}`);
            }

            return this.handleResponse(response);

        } catch (error) {
            return this.handleError(error);
        }
    }

    handleResponse(response) {
        if (response.status >= 200 && response.status < 300) {
            return response.data;
        }
        throw new Error(`Unexpected status code: ${response.status}`);
    }

    handleError(error) {
        console.error('API Request Failed:', error.message);

        // Handle specific axios errors
        if (error.response) {
            const { data, status } = error.response;
            console.error(`Status Code: ${status}, Response Data:`, data);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }

        return null;
    }
}

module.exports = ApiClient;