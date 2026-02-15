import { useEffect, useState } from 'react';
import axios from 'axios';
import { DeviceCard } from './DeviceCard';
import { RefreshCw, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';

// Configure Axios
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
});

interface Device {
    mac: string;
    ip: string;
    hostname: string;
    vendor: string;
    status: 'ONLINE' | 'UNSTABLE' | 'OFFLINE';
    source: 'UNIFI' | 'SCAN' | 'BOTH';
    last_seen: number;
    is_wired: number;
    is_fixed_ip: number;
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
            if (res.data.url) {
                window.open(res.data.url, '_blank');
            } else {
                alert(`Report Generated:\n${res.data.message}`);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to generate report');
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
        <div className="min-h-screen bg-[#020617] text-slate-100 p-8 font-sans transition-colors duration-500 selection:bg-emerald-500/30">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 bg-white/[0.02] backdrop-blur-md p-6 rounded-3xl border border-white/5 shadow-2xl animate-fade-in">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <Activity size={24} className="text-emerald-400 status-pulse" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tighter text-white">NetPulse</h1>
                        </div>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Dynamic Network Stream • Updated {lastUpdated.toLocaleTimeString()}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={triggerScan}
                            disabled={scanning}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300
                            ${scanning
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95'}`}
                        >
                            <RefreshCw size={16} className={scanning ? 'animate-spin' : ''} />
                            {scanning ? 'Discovering...' : 'Initiate Scan'}
                        </button>
                        <button
                            onClick={downloadReport}
                            className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all duration-300 font-bold text-xs uppercase tracking-widest active:scale-95"
                        >
                            Export Report
                        </button>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white/[0.02] backdrop-blur-sm p-6 rounded-3xl border border-white/5 shadow-xl animate-fade-in hover:bg-white/[0.04] transition-colors group" style={{ animationDelay: '0.1s' }}>
                        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3 opacity-60 group-hover:opacity-100 transition-opacity">Registered Pool</div>
                        <div className="text-4xl font-black text-white tracking-tighter">{devices.length}</div>
                    </div>
                    <div className="bg-white/[0.02] backdrop-blur-sm p-6 rounded-3xl border border-white/5 shadow-xl animate-fade-in hover:bg-white/[0.04] transition-colors group" style={{ animationDelay: '0.2s' }}>
                        <div className="text-emerald-500/80 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                            <CheckCircle2 size={12} /> Active Nodes
                        </div>
                        <div className="text-4xl font-black text-emerald-400 tracking-tighter">{onlineCount}</div>
                    </div>
                    <div className="bg-white/[0.02] backdrop-blur-sm p-6 rounded-3xl border border-white/5 shadow-xl animate-fade-in hover:bg-white/[0.04] transition-colors group" style={{ animationDelay: '0.3s' }}>
                        <div className="text-rose-500/80 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                            <AlertCircle size={12} /> Disconnected
                        </div>
                        <div className="text-4xl font-black text-rose-400 tracking-tighter">{offlineCount}</div>
                    </div>
                </div>

                {/* Device List Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Network Environment</h2>
                        <div className="h-px flex-1 mx-6 bg-white/5" />
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4 animate-pulse">
                            <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                            <div className="text-[10px] font-bold uppercase tracking-widest">Synchronizing Metadata...</div>
                        </div>
                    ) : devices.length === 0 ? (
                        <div className="text-center py-20 text-slate-500 bg-white/[0.02] rounded-3xl border border-dashed border-white/10 mx-2">
                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">No participants detected in the current scope.</div>
                        </div>
                    ) : (
                        <div className="grid gap-4 px-1">
                            {devices
                                .sort((a, b) => {
                                    const statusWeight = { 'ONLINE': 0, 'UNSTABLE': 1, 'OFFLINE': 2 };
                                    if (a.status !== b.status) return statusWeight[a.status] - statusWeight[b.status];
                                    return b.last_seen - a.last_seen;
                                })
                                .map(device => (
                                    <DeviceCard key={device.mac} device={device} />
                                ))
                            }
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
