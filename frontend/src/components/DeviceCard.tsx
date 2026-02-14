import { Wifi, Network } from 'lucide-react';

interface Device {
    mac: string;
    ip: string;
    hostname: string;
    vendor: string;
    status: 'ONLINE' | 'OFFLINE';
    source: 'UNIFI' | 'SCAN' | 'BOTH';
    last_seen: number;
}

interface Props {
    device: Device;
}

export const DeviceCard = ({ device }: Props) => {
    const isOnline = device.status === 'ONLINE';

    return (
        <div className={`p-4 rounded-lg border ${isOnline ? 'border-green-500/30 bg-green-900/10' : 'border-red-500/30 bg-red-900/10'} shadow-sm flex items-center justify-between`}>
            <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-full ${isOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {device.hostname ? <Network size={24} /> : <Wifi size={24} />}
                </div>
                <div>
                    <h3 className="font-medium text-lg text-white">{device.hostname || 'Unknown Device'}</h3>
                    <div className="text-sm text-slate-400 font-mono">{device.ip}</div>
                    <div className="text-xs text-slate-500 font-mono mt-1">{device.mac.toUpperCase()}</div>
                </div>
            </div>
            <div className="text-right">
                <div className={`px-2 py-1 rounded text-xs font-bold inline-block mb-1 ${isOnline ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {device.status}
                </div>
                <div className="text-xs text-slate-500 flex items-center justify-end gap-1">
                    {device.source === 'UNIFI' && 'UniFi'}
                    {device.source === 'SCAN' && 'Scan'}
                    {device.source === 'BOTH' && 'UniFi + Scan'}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                    {new Date(device.last_seen).toLocaleTimeString()}
                </div>
            </div>
        </div>
    );
};
