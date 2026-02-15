import axios, { AxiosInstance } from 'axios';
import { httpsAgent } from './http-agent';
import { config } from '../config';
import { UniFiClient, UniFiResponse } from '../types/unifi';
import { DatabaseService } from './database';

export class UniFiService {
    private client: AxiosInstance;
    private loggedIn = false;
    private db: DatabaseService;

    constructor(db: DatabaseService) {
        this.db = db;
        const url = this.db.getSetting('UNIFI_URL') || config.unifi.url;
        this.client = axios.create({
            baseURL: url,
            httpsAgent: config.unifi.ignoreSsl ? httpsAgent : undefined,
            timeout: 10000,
            withCredentials: true,
            maxRedirects: 0,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        });
    }

    private getDynamicConfig() {
        return {
            url: this.db.getSetting('UNIFI_URL') || config.unifi.url,
            user: this.db.getSetting('UNIFI_USER') || config.unifi.user,
            password: this.db.getSetting('UNIFI_PASSWORD') || config.unifi.password,
            site: this.db.getSetting('UNIFI_SITE') || config.unifi.site,
        };
    }

    async login(): Promise<boolean> {
        this.loggedIn = false;
        const dConfig = this.getDynamicConfig();

        // Update client baseURL in case it changed in DB
        this.client.defaults.baseURL = dConfig.url;

        try {
            const sanitizedUser = dConfig.user.trim();
            console.log(`Attempting login to ${dConfig.url} with user [${sanitizedUser}]...`);

            const headers = {
                'Referer': `${dConfig.url}/`,
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
                    password: dConfig.password,
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
                password: dConfig.password,
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
        const dConfig = this.getDynamicConfig();
        if (!this.loggedIn) {
            const success = await this.login();
            if (!success) {
                console.warn('⚠️ Cannot fetch clients: Not logged in');
                return [];
            }
        }

        const endpoints = [
            `/proxy/network/api/s/${dConfig.site}/stat/sta`, // UniFi OS Proxy
            `/api/s/${dConfig.site}/stat/sta`                // Legacy / Direct
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
