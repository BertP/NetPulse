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
            console.log(`Attempting login to ${config.unifi.url}...`);

            // Add Referer header which is often required for UniFi OS
            const headers = { 'Referer': config.unifi.url };

            // 1. Try UniFi OS Login (/api/auth/login)
            try {
                const response = await this.client.post('/api/auth/login', {
                    username: config.unifi.user,
                    password: config.unifi.password,
                    remember: true
                }, { headers, validateStatus: (status) => status === 200 || status === 302 });

                if (response.status === 200 || response.status === 302) {
                    this.handleLoginSuccess(response);
                    console.log('✅ Connected to UniFi Controller (UniFi OS)');
                    return true;
                }
            } catch (e: any) {
                // Ignore and try next method
            }

            // 2. Try Legacy Login (/api/login)
            const response = await this.client.post('/api/login', {
                username: config.unifi.user,
                password: config.unifi.password,
            }, { headers, validateStatus: (status) => status === 200 || status === 302 });

            if (response.status === 200 || response.status === 302) {
                this.handleLoginSuccess(response);
                console.log('✅ Connected to UniFi Controller (Legacy)');
                return true;
            }

        } catch (error: any) {
            console.error('❌ UniFi Login Failed:', error.message);
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', JSON.stringify(error.response.data));
            }
        }
        return false;
    }

    private handleLoginSuccess(response: any) {
        const setCookie = response.headers['set-cookie'];
        if (setCookie) {
            this.client.defaults.headers.Cookie = setCookie;
        }
        // Extract CSRF token if present
        const csrfToken = response.headers['x-csrf-token'];
        if (csrfToken) {
            this.client.defaults.headers['x-csrf-token'] = csrfToken;
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
