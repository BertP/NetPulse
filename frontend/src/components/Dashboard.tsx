import { useEffect, useState } from 'react';
import axios from 'axios';
import { DeviceCard } from './DeviceCard';
import { RefreshCw, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';

// Configure Axios
const api = axios.create({
    baseURL: 'http://localhost:3000', // Update for prod or use env
});

interface Device {
    mac: string;
    ip: string;
    hostname: string;
    vendor: string;
    status: 'ONLINE' | 'OFFLINE';
    source: 'UNIFI' | 'SCAN' | 'BOTH';
    last_seen: number;
}

export const Dashboard = () => {
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchDevices = async () => {
        try {
            const res = await api.get('/devices');
            setDevices(res.data);
            setLastUpdated(new Date());
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch devices:', error);
            setLoading(false);
        }
    };

    const triggerScan = async () => {
        setScanning(true);
        try {
            await api.post('/scan');
            // Optimistic loading or wait?
            // Usually network scan takes time. 
            // We just trigger it, and let polling pick up changes.
            setTimeout(fetchDevices, 2000); // Quick refresh after trigger
        } catch (e) {
            console.error(e);
        } finally {
            setScanning(false);
        }
    };

    const downloadReport = async () => {
        try {
            const res = await api.post('/report');
            alert(`Report Generated:\n${res.data.message}`);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchDevices();
        const interval = setInterval(fetchDevices, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const onlineCount = devices.filter(d => d.status === 'ONLINE').length;
    const offlineCount = devices.length - onlineCount;

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        NetPulse Monitor
                    </h1>
                    <p className="text-slate-400 text-sm flex items-center gap-2">
                        <Activity size={14} className="text-green-500" />
                        Live Monitoring • Updated {lastUpdated.toLocaleTimeString()}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={triggerScan}
                        disabled={scanning}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                        ${scanning
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg py-2'}`}
                    >
                        <RefreshCw size={18} className={scanning ? 'animate-spin' : ''} />
                        {scanning ? 'Scanning...' : 'Scan Network'}
                    </button>
                    <button
                        onClick={downloadReport}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all font-medium"
                    >
                        Generate Report
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div className="text-slate-400 text-sm mb-1">Total Devices</div>
                    <div className="text-3xl font-bold text-white">{devices.length}</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div className="text-slate-400 text-sm mb-1 flex items-center gap-1">
                        <CheckCircle2 size={14} className="text-green-500" /> Online
                    </div>
                    <div className="text-3xl font-bold text-green-400">{onlineCount}</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div className="text-slate-400 text-sm mb-1 flex items-center gap-1">
                        <AlertCircle size={14} className="text-red-500" /> Offline
                    </div>
                    <div className="text-3xl font-bold text-red-400">{offlineCount}</div>
                </div>
            </div>

            {/* Device List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="text-center py-12 text-slate-500">Loading devices...</div>
                ) : devices.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 bg-slate-800/50 rounded-lg">No devices found. Try scanning.</div>
                ) : (
                    devices
                        .sort((a, b) => b.last_seen - a.last_seen)
                        .map(device => (
                            <DeviceCard key={device.mac} device={device} />
                        ))
                )}
            </div>
        </div>
    );
};
