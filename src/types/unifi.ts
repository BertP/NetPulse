export interface UniFiResponse<T> {
    meta: {
        rc: string;
        msg?: string;
    };
    data: T[];
}

export interface UniFiClient {
    _id: string;
    mac: string;
    ip: string;
    hostname?: string;
    name?: string;
    oui: string; // Vendor
    is_wired: boolean;
    last_seen: number;
    uplink_mac?: string;
}

export interface UniFiDevice {
    _id: string;
    mac: string;
    ip: string;
    model: string;
    version: string;
    name?: string;
    adopted: boolean;
}
