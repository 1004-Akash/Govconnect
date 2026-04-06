import React, { useState } from 'react';

export default function CivicPulse() {
    const [form, setForm] = useState({
        text: '',
        lat: '',
        lon: '',
        severity_tag: 0.5,
        category: 'General',
        infra_age: '',
        rainfall: '',
        image: null
    });
    const [success, setSuccess] = useState(false);
    const [locating, setLocating] = useState(false);
    const [locationError, setLocationError] = useState('');

    const handleChange = e => {
        const { name, value, type, files } = e.target;
        setForm(f => ({
            ...f,
            [name]: type === 'file' ? files[0] : value
        }));
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported in this browser.');
            return;
        }

        setLocating(true);
        setLocationError('');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setForm(f => ({
                    ...f,
                    lat: latitude.toString(),
                    lon: longitude.toString()
                }));
                setLocating(false);
            },
            (error) => {
                console.error('Geolocation error:', error);
                setLocationError('Unable to get your location. Please allow location access or enter it manually.');
                setLocating(false);
            }
        );
    };

    const handleSubmit = async e => {
        e.preventDefault();
        const data = new FormData();
        Object.entries(form).forEach(([k, v]) => {
            if (v !== null && v !== undefined && v !== '') data.append(k, v);
        });
        
        try {
            const response = await fetch('http://localhost:8000/civicpulse/reports', {
                method: 'POST',
                body: data
            });
            
            if (response.ok) {
                setSuccess(true);
                setForm({ 
                    text: '', 
                    lat: '', 
                    lon: '', 
                    severity_tag: 0.5, 
                    category: 'General', 
                    infra_age: '', 
                    rainfall: '', 
                    image: null 
                });
            } else {
                console.error('Failed to submit issue');
            }
        } catch (error) {
            console.error('Error submitting issue:', error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <div className="rounded-3xl border bg-white dark:bg-slate-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 shadow-lg p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white mb-4">
                                Welcome to CivicPulse
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                                Use this portal to report civic issues in your area. Please fill out the form below with accurate details. 
                                Your report will help local authorities take action.
                            </p>
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mb-6">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">
                                Report a Civic Issue
                            </h2>
                            
                            {success && (
                                <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-medium">Your issue has been submitted successfully!</span>
                                    </div>
                                </div>
                            )}
                            
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Description:
                                    </label>
                                    <textarea 
                                        className="w-full rounded-full border bg-white/90 dark:bg-slate-900 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 min-h-[100px] resize-vertical"
                                        name="text" 
                                        value={form.text} 
                                        onChange={handleChange} 
                                        required 
                                        placeholder="Describe the civic issue in detail..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Latitude:
                                        </label>
                                        <input 
                                            className="w-full rounded-full border bg-white/90 dark:bg-slate-900 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                            name="lat" 
                                            type="number" 
                                            value={form.lat} 
                                            onChange={handleChange} 
                                            required 
                                            placeholder="Enter latitude"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Longitude:
                                        </label>
                                        <input 
                                            className="w-full rounded-full border bg-white/90 dark:bg-slate-900 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                            name="lon" 
                                            type="number" 
                                            value={form.lon} 
                                            onChange={handleChange} 
                                            required 
                                            placeholder="Enter longitude"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                    <button
                                        type="button"
                                        onClick={handleUseCurrentLocation}
                                        disabled={locating}
                                        className="inline-flex items-center justify-center rounded-full bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
                                    >
                                        {locating ? 'Detecting location…' : 'Use my current location'}
                                    </button>
                                    {locationError && (
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            {locationError}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Severity (0-1):
                                        </label>
                                        <input 
                                            className="w-full rounded-full border bg-white/90 dark:bg-slate-900 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                            name="severity_tag" 
                                            type="number" 
                                            min="0" 
                                            max="1" 
                                            step="0.01" 
                                            value={form.severity_tag} 
                                            onChange={handleChange} 
                                            required 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Category:
                                        </label>
                                        <select 
                                            className="w-full rounded-full border bg-white/90 dark:bg-slate-900 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                            name="category" 
                                            value={form.category} 
                                            onChange={handleChange}
                                        >
                                            <option value="General">General</option>
                                            <option value="Water Issue">Water Issue</option>
                                            <option value="Road Issue">Road Issue</option>
                                            <option value="Garbage Issue">Garbage Issue</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Infrastructure Age (years):
                                        </label>
                                        <input 
                                            className="w-full rounded-full border bg-white/90 dark:bg-slate-900 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                            name="infra_age" 
                                            type="number" 
                                            value={form.infra_age} 
                                            onChange={handleChange} 
                                            placeholder="Enter age in years"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Rainfall (mm):
                                        </label>
                                        <input 
                                            className="w-full rounded-full border bg-white/90 dark:bg-slate-900 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                            name="rainfall" 
                                            type="number" 
                                            value={form.rainfall} 
                                            onChange={handleChange} 
                                            placeholder="Enter rainfall in mm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Image (optional):
                                    </label>
                                    <input 
                                        className="w-full rounded-full border bg-white/90 dark:bg-slate-900 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/20 dark:file:text-emerald-400"
                                        name="image" 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleChange} 
                                    />
                                </div>

                                <button 
                                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-4 py-2 md:px-5 md:py-2.5 hover:bg-emerald-700 active:scale-[.99] disabled:opacity-50 w-full py-3 text-lg"
                                    type="submit"
                                >
                                    Submit Issue
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
