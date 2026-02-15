
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Save, Shield, Mail, Globe, ChevronLeft, RefreshCw } from 'lucide-react';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
});

interface SettingsProps {
    onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack }) => {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            setSettings(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            await api.post('/settings', settings);
            setMessage({ type: 'success', text: 'Settings saved successfully' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4 animate-pulse">
                <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                <div className="text-[10px] font-bold uppercase tracking-widest">Loading Configuration...</div>
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
                <h2 className="text-2xl font-black text-white tracking-tight">System Settings</h2>
            </div>

            <form onSubmit={handleSave} className="space-y-8 pb-20">
                {/* section: UniFi */}
                <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-6 text-emerald-400 uppercase text-[10px] font-black tracking-widest">
                        <Shield size={14} /> UniFi Controller
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Controller URL" value={settings.UNIFI_URL} onChange={v => handleChange('UNIFI_URL', v)} placeholder="https://192.168.1.1" />
                        <Field label="Site ID" value={settings.UNIFI_SITE} onChange={v => handleChange('UNIFI_SITE', v)} placeholder="default" />
                        <Field label="Username" value={settings.UNIFI_USER} onChange={v => handleChange('UNIFI_USER', v)} />
                        <Field label="Password" value={settings.UNIFI_PASSWORD} onChange={v => handleChange('UNIFI_PASSWORD', v)} type="password" />
                    </div>
                </section>

                {/* section: Scanner */}
                <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-6 text-blue-400 uppercase text-[10px] font-black tracking-widest">
                        <Globe size={14} /> Network Scanner
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Scan Subnets (e.g. 192.168.1, 192.168.2)" value={settings.SCAN_SUBNET} onChange={v => handleChange('SCAN_SUBNET', v)} placeholder="192.168.1, 192.168.2" />
                        <Field label="Server IP (for Links)" value={settings.SERVER_IP} onChange={v => handleChange('SERVER_IP', v)} placeholder="192.168.1.x" />
                    </div>
                </section>

                {/* section: Alerts */}
                <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-6 text-rose-400 uppercase text-[10px] font-black tracking-widest">
                        <Mail size={14} /> Alerting & SMTP
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="SMTP Host" value={settings.SMTP_HOST} onChange={v => handleChange('SMTP_HOST', v)} />
                        <Field label="SMTP Port" value={settings.SMTP_PORT} onChange={v => handleChange('SMTP_PORT', v)} />
                        <Field label="SMTP User" value={settings.SMTP_USER} onChange={v => handleChange('SMTP_USER', v)} />
                        <Field label="SMTP Password" value={settings.SMTP_PASS} onChange={v => handleChange('SMTP_PASS', v)} type="password" />
                        <Field label="From Email" value={settings.SMTP_FROM} onChange={v => handleChange('SMTP_FROM', v)} />
                        <Field label="To Email" value={settings.SMTP_TO} onChange={v => handleChange('SMTP_TO', v)} />
                        <Field label="Threshold (Minutes)" value={settings.ALERT_THRESHOLD_MIN} onChange={v => handleChange('ALERT_THRESHOLD_MIN', v)} />
                    </div>
                </section>

                {message && (
                    <div className={`p-4 rounded-xl text-xs font-bold uppercase tracking-widest text-center ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                        {message.text}
                    </div>
                )}

                <div className="fixed bottom-8 right-8 left-8 max-w-4xl mx-auto flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
};

const Field = ({ label, value, onChange, placeholder, type = 'text' }: { label: string, value?: string, onChange: (v: string) => void, placeholder?: string, type?: string }) => (
    <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
        <input
            type={type}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-700 focus:outline-none focus:border-emerald-500/50 transition-colors"
        />
    </div>
);
