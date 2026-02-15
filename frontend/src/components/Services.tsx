
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ChevronLeft, Server, Cpu, Globe } from 'lucide-react';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== '/'
        ? import.meta.env.VITE_API_URL
        : window.location.origin,
});

interface mDNSService {
    id: number;
    ip: string;
    name: string;
    type: string;
    protocol: string;
    port: number;
    txt: string;
    updated_at: number;
}

interface ServicesProps {
    onBack: () => void;
}

export const Services: React.FC<ServicesProps> = ({ onBack }) => {
    const [services, setServices] = useState<mDNSService[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get('/services');
                setServices(res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const grouped = services.reduce((acc, svc) => {
        if (!acc[svc.ip]) acc[svc.ip] = [];
        acc[svc.ip].push(svc);
        return acc;
    }, {} as Record<string, mDNSService[]>);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4 animate-pulse">
                <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                <div className="text-[10px] font-bold uppercase tracking-widest">Scanning Protocols...</div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="flex flex-col">
                    <h2 className="text-2xl font-black text-white tracking-tight">mDNS Discovery</h2>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">ZeroConf Service Map</p>
                </div>
            </div>

            {services.length === 0 ? (
                <div className="text-center py-20 text-slate-500 bg-white/[0.02] rounded-3xl border border-dashed border-white/10 mx-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">No network services detected yet.</div>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(grouped).map(([ip, svcs]) => (
                        <div key={ip} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-sm animate-fade-in">
                            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-xl">
                                        <Server size={18} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-white tracking-tight">{ip}</div>
                                        <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Host Node</div>
                                    </div>
                                </div>
                                <div className="px-3 py-1 rounded-full bg-blue-500/5 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                                    {svcs.length} Service{svcs.length > 1 ? 's' : ''}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {svcs.map(svc => (
                                    <div key={svc.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-blue-500/30 transition-all group overflow-hidden relative">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                                <span className="text-xs font-black text-blue-400 uppercase tracking-widest">{svc.type}.{svc.protocol}</span>
                                            </div>
                                            <h4 className="font-bold text-slate-100 group-hover:text-white transition-colors truncate pr-8" title={svc.name}>
                                                {svc.name}
                                            </h4>
                                            <div className="flex items-center gap-3 mt-2">
                                                <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-black/20 px-1.5 py-0.5 rounded">
                                                    <Globe size={10} /> Port {svc.port}
                                                </div>
                                                <div className="text-[10px] text-slate-600 font-medium">
                                                    Updated {new Date(svc.updated_at).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="absolute top-4 right-4 text-slate-700 group-hover:text-blue-500/50 transition-colors">
                                            <Cpu size={20} />
                                        </div>

                                        {svc.txt && svc.txt !== '{}' && (
                                            <div className="mt-4 pt-4 border-t border-white/5">
                                                <div className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] mb-2">Capabilities</div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {Object.entries(JSON.parse(svc.txt)).map(([k, v]) => (
                                                        <div key={k} className="px-2 py-0.5 bg-white/5 rounded-md text-[9px] text-slate-400 border border-white/5 whitespace-nowrap">
                                                            <span className="text-slate-600">{k}:</span> {String(v)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
