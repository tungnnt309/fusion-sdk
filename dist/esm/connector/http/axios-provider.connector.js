import axios from 'axios';
import { AuthError } from '../../errors';
export class AxiosProviderConnector {
    constructor(authKey) {
        this.authKey = authKey;
    }
    async get(url) {
        try {
            const res = await axios.get(url, this.authKey
                ? {
                    headers: {
                        Authorization: `Bearer ${this.authKey}`
                    }
                }
                : undefined);
            return res.data;
        }
        catch (error) {
            if (error.response?.status === 401) {
                throw new AuthError();
            }
            throw error;
        }
    }
    async post(url, data) {
        try {
            const res = await axios.post(url, data, this.authKey
                ? {
                    headers: {
                        Authorization: `Bearer ${this.authKey}`
                    }
                }
                : undefined);
            return res.data;
        }
        catch (error) {
            if (error.response?.status === 401) {
                throw new AuthError();
            }
            throw error;
        }
    }
}
//# sourceMappingURL=axios-provider.connector.js.map