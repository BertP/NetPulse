import axios, { AxiosInstance } from 'axios';
import { httpsAgent } from './http-agent';
import { config } from '../config';
import { UniFiClient, UniFiResponse } from '../types/unifi';

export class UniFiService {
    private client: AxiosInstance;
    private loggedIn = false;

    constructor() {
        this.client = axios.create({
            baseURL: config.unifi.url,
            httpsAgent: config.unifi.ignoreSsl ? httpsAgent : undefined,
            timeout: 10000,
            withCredentials: true, // Important for cookie retention
            maxRedirects: 0, // Prevent auto-redirects to handle 302s manually if needed
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        });
    }

    async login(): Promise<boolean> {
        this.loggedIn = false;

        try {
            const sanitizedUser = config.unifi.user.trim();
            console.log(`Attempting login to ${config.unifi.url} with user [${sanitizedUser}]...`);

            const headers = {
                'Referer': `${config.unifi.url}/`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*'
            };

            // 0. Pre-fetch to get initial CSRF/Cookies (UDM/UCG requirement)
            try {
                console.log('Pre-fetching UniFi OS root...');
                const pre = await this.client.get('/', { headers, validateStatus: () => true });
                this.handleLoginSuccess(pre);
            } catch (e) {
                // Continue anyway
            }

            // 1. Try UniFi OS Login (/api/auth/login)
            try {
                const response = await this.client.post('/api/auth/login', {
                    username: sanitizedUser,
                    password: config.unifi.password,
                    remember: true
                }, { headers, validateStatus: (status) => status === 200 || status === 302 || status === 403 });

                if (response.status === 200 || response.status === 302) {
                    this.handleLoginSuccess(response);
                    console.log(`✅ Connected to UniFi Controller (UniFi OS) - Status: ${response.status}`);
                    return true;
                } else if (response.status === 403) {
                    console.log('⚠️ UniFi OS Login returned 403 (Forbidden). Trying Legacy...');
                }
            } catch (e: any) {
                console.log(`UniFi OS Login attempt failed: ${e.message}`);
                // Continue to Legacy
            }

            // 2. Try Legacy Login (/api/login)
            console.log('Attempting Legacy Login...');
            const response = await this.client.post('/api/login', {
                username: sanitizedUser,
                password: config.unifi.password,
            }, { headers, validateStatus: (status) => status === 200 || status === 302 });

            if (response.status === 200 || response.status === 302) {
                this.handleLoginSuccess(response);
                console.log(`✅ Connected to UniFi Controller (Legacy) - Status: ${response.status}`);
                return true;
            }

        } catch (error: any) {
            console.error('❌ UniFi Login Final Failure:', error.message);
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', JSON.stringify(error.response.data));
                console.error('Headers:', JSON.stringify(error.response.headers));
            }
        }
        return false;
    }

    private handleLoginSuccess(response: any) {
        const setCookie = response.headers['set-cookie'];
        if (setCookie) {
            // Join array of cookies if necessary
            const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
            this.client.defaults.headers.Cookie = cookieStr;
            console.log('🔑 Cookies captured');
        }

        // Extract CSRF token if present
        const csrfToken = response.headers['x-csrf-token'];
        if (csrfToken) {
            this.client.defaults.headers['x-csrf-token'] = csrfToken;
            console.log('🔑 CSRF Token captured');
        }
        this.loggedIn = true;
    }

    async getClients(): Promise<UniFiClient[]> {
        if (!this.loggedIn) {
            const success = await this.login();
            if (!success) {
                console.warn('⚠️ Cannot fetch clients: Not logged in');
                return [];
            }
        }

        const endpoints = [
            `/proxy/network/api/s/${config.unifi.site}/stat/sta`, // UniFi OS Proxy
            `/api/s/${config.unifi.site}/stat/sta`                // Legacy / Direct
        ];

        for (const url of endpoints) {
            try {
                const response = await this.client.get<UniFiResponse<UniFiClient>>(url);
                if (response.data && response.data.data) {
                    return response.data.data;
                }
            } catch (error: any) {
                if (error.response && error.response.status === 401) {
                    this.loggedIn = false;
                }
                // Continue to next endpoint
            }
        }

        console.warn('⚠️ Failed to fetch clients from all known endpoints');
        return [];
    }
}
