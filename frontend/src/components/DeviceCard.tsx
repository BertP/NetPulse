import { Wifi, Network } from 'lucide-react';

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

interface Props {
    device: Device;
}

export const DeviceCard = ({ device }: Props) => {
    const isOnline = device.status === 'ONLINE';
    const isUnstable = device.status === 'UNSTABLE';
    const isWired = device.is_wired === 1;

    const statusStyles = isOnline
        ? 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40'
        : isUnstable
            ? 'border-orange-500/20 bg-orange-500/5 hover:border-orange-500/40'
            : 'border-rose-500/20 bg-rose-500/5 hover:border-rose-500/40';

    const iconStyles = isOnline
        ? 'bg-emerald-500/20 text-emerald-400'
        : isUnstable
            ? 'bg-orange-500/20 text-orange-400'
            : 'bg-rose-500/20 text-rose-400';

    return (
        <div className={`p-4 rounded-2xl border ${statusStyles} shadow-sm transition-all duration-300 group flex items-center justify-between animate-fade-in`}>
            <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${iconStyles} transition-colors relative`}>
                    {isWired ? <Network size={22} /> : <Wifi size={22} />}
                    {device.is_fixed_ip === 1 && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-slate-950" title="Fixed IP" />
                    )}
                </div>
                <div>
                    <h3 className="font-semibold text-slate-100 group-hover:text-white transition-colors">
                        {device.hostname || 'Unknown Device'}
                    </h3>
                    <div className="text-sm text-slate-400 font-mono mt-0.5">{device.ip || 'No IP detected'}</div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mt-1 opacity-70">
                        {device.mac} • {device.vendor || 'Generic'}
                    </div>
                </div>
            </div>
            <div className="text-right flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full status-pulse ${isOnline ? 'bg-emerald-400' : isUnstable ? 'bg-orange-400' : 'bg-rose-400'
                        }`} />
                    <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${isOnline ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20'
                        : isUnstable ? 'bg-orange-600/20 text-orange-400 border border-orange-500/20'
                            : 'bg-rose-600/20 text-rose-400 border border-rose-500/20'
                        }`}>
                        {device.status}
                    </div>
                </div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium bg-white/5 px-1.5 py-0.5 rounded leading-none">
                    {device.source === 'UNIFI' && 'UniFi Cloud'}
                    {device.source === 'SCAN' && 'Local Scan'}
                    {device.source === 'BOTH' && 'Redundant'}
                </div>
                <div className="text-[10px] text-slate-600 italic">
                    Seen {new Date(device.last_seen).toLocaleTimeString()}
                </div>
            </div>
        </div>
    );
};
