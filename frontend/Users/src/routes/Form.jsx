import React, { useState } from 'react';
import axios from 'axios';
import Card from '../components/Card';

const BACKEND_URL = 'http://127.0.0.1:8000';

function boolOptions() {
    return (
        <>
            <option value="">--</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
        </>
    );
}

const initialProfile = {
    age: '',
    gender: '',
    occupation: '',
    is_student: '',
    income: '',
    caste: '',
    state: '',
    has_land: '',
    land_size_acres: '',
    is_farmer: '',
    is_marginal_farmer: '',
    has_government_job: '',
    is_unemployed: '',
    has_bank_account: '',
    is_married: '',
    family_size: '',
    is_widow: '',
    is_disabled: '',
    is_rural: '',
    district: ''
};

function normalizeProfile(p) {
    const out = {};
    Object.entries(p).forEach(([k, v]) => {
        if (v === '' || v === null || v === undefined) return;
        if (['is_student','has_land','is_farmer','is_marginal_farmer','has_government_job','is_unemployed','has_bank_account','is_married','is_widow','is_disabled','is_rural'].includes(k)) {
            if (v === 'true') out[k] = true; else if (v === 'false') out[k] = false;
        } else if (['age','income','family_size'].includes(k)) {
            const num = parseInt(v, 10);
            if (!Number.isNaN(num)) out[k] = num;
        } else if (['land_size_acres'].includes(k)) {
            const num = parseFloat(v);
            if (!Number.isNaN(num)) out[k] = num;
        } else {
            out[k] = v;
        }
    });
    return out;
}

export default function Form() {
    const [profile, setProfile] = useState(initialProfile);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const onChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const payload = { profile: normalizeProfile(profile) };
            const { data } = await axios.post(`${BACKEND_URL}/govmatch/check`, payload);
            setResult(data);
        } catch (err) {
            const msg = err?.response?.data?.detail || err.message || 'Request failed';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Add these new functions
    const downloadPDF = async (schemeId) => {
        try {
            const response = await axios.get(`${BACKEND_URL}/govmatch/download-pdf/${schemeId}`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${schemeId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Failed to download PDF. Please try again.');
        }
    };

    const openWebsite = (url) => {
        if (url) {
            window.open(url, '_blank');
        } else {
            alert('Website URL not available for this scheme.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="container mx-auto px-4 py-8">
                {/* Page Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white mb-3">
                        GovMatch Eligibility
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-lg">
                        Provide your details to discover matching government schemes.
                    </p>
                </div>

                {/* Two-column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Form Card */}
                    <Card className="p-0 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                Your Details
                            </h2>
                        </div>
                        
                        <form onSubmit={onSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Age */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Age
                                    </label>
                                    <input
                                        name="age"
                                        type="number"
                                        value={profile.age}
                                        onChange={onChange}
                                        className="input-round"
                                        placeholder="Enter age"
                                    />
                                </div>

                                {/* Gender */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Gender
                                    </label>
                                    <select
                                        name="gender"
                                        value={profile.gender}
                                        onChange={onChange}
                                        className="input-round"
                                    >
                                        <option value="">Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                {/* Occupation */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Occupation
                                    </label>
                                    <input
                                        name="occupation"
                                        value={profile.occupation}
                                        onChange={onChange}
                                        className="input-round"
                                        placeholder="Enter occupation"
                                    />
                                </div>

                                {/* Student */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Student
                                    </label>
                                    <select
                                        name="is_student"
                                        value={profile.is_student}
                                        onChange={onChange}
                                        className="input-round"
                                    >
                                        {boolOptions()}
                                    </select>
                                </div>

                                {/* Annual Income */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Annual Income
                                    </label>
                                    <input
                                        name="income"
                                        type="number"
                                        value={profile.income}
                                        onChange={onChange}
                                        className="input-round"
                                        placeholder="Enter annual income"
                                    />
                                </div>

                                {/* Caste */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Caste
                                    </label>
                                    <input
                                        name="caste"
                                        value={profile.caste}
                                        onChange={onChange}
                                        className="input-round"
                                        placeholder="Enter caste"
                                    />
                                </div>

                                {/* State */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        State
                                    </label>
                                    <input
                                        name="state"
                                        value={profile.state}
                                        onChange={onChange}
                                        className="input-round"
                                        placeholder="Enter state"
                                    />
                                </div>

                                {/* District */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        District
                                    </label>
                                    <input
                                        name="district"
                                        value={profile.district}
                                        onChange={onChange}
                                        className="input-round"
                                        placeholder="Enter district"
                                    />
                                </div>

                                {/* Has Land */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Has Land
                                    </label>
                                    <select
                                        name="has_land"
                                        value={profile.has_land}
                                        onChange={onChange}
                                        className="input-round"
                                    >
                                        {boolOptions()}
                                    </select>
                                </div>

                                {/* Land Size */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Land Size (acres)
                                    </label>
                                    <input
                                        name="land_size_acres"
                                        type="number"
                                        step="0.01"
                                        value={profile.land_size_acres}
                                        onChange={onChange}
                                        className="input-round"
                                        placeholder="Enter land size"
                                    />
                                </div>

                                {/* Farmer */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Farmer
                                    </label>
                                    <select
                                        name="is_farmer"
                                        value={profile.is_farmer}
                                        onChange={onChange}
                                        className="input-round"
                                    >
                                        {boolOptions()}
                                    </select>
                                </div>

                                {/* Marginal Farmer */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Marginal Farmer
                                    </label>
                                    <select
                                        name="is_marginal_farmer"
                                        value={profile.is_marginal_farmer}
                                        onChange={onChange}
                                        className="input-round"
                                    >
                                        {boolOptions()}
                                    </select>
                                </div>

                                {/* Government Job */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Government Job
                                    </label>
                                    <select
                                        name="has_government_job"
                                        value={profile.has_government_job}
                                        onChange={onChange}
                                        className="input-round"
                                    >
                                        {boolOptions()}
                                    </select>
                                </div>

                                {/* Unemployed */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Unemployed
                                    </label>
                                    <select
                                        name="is_unemployed"
                                        value={profile.is_unemployed}
                                        onChange={onChange}
                                        className="input-round"
                                    >
                                        {boolOptions()}
                                    </select>
                                </div>

                                {/* Bank Account */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Bank Account
                                    </label>
                                    <select
                                        name="has_bank_account"
                                        value={profile.has_bank_account}
                                        onChange={onChange}
                                        className="input-round"
                                    >
                                        {boolOptions()}
                                    </select>
                                </div>

                                {/* Married */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Married
                                    </label>
                                    <select
                                        name="is_married"
                                        value={profile.is_married}
                                        onChange={onChange}
                                        className="input-round"
                                    >
                                        {boolOptions()}
                                    </select>
                                </div>

                                {/* Family Size */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Family Size
                                    </label>
                                    <input
                                        name="family_size"
                                        type="number"
                                        value={profile.family_size}
                                        onChange={onChange}
                                        className="input-round"
                                        placeholder="Enter family size"
                                    />
                                </div>

                                {/* Widow */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Widow
                                    </label>
                                    <select
                                        name="is_widow"
                                        value={profile.is_widow}
                                        onChange={onChange}
                                        className="input-round"
                                    >
                                        {boolOptions()}
                                    </select>
                                </div>

                                {/* Disabled */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Disabled
                                    </label>
                                    <select
                                        name="is_disabled"
                                        value={profile.is_disabled}
                                        onChange={onChange}
                                        className="input-round"
                                    >
                                        {boolOptions()}
                                    </select>
                                </div>

                                {/* Rural */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Rural
                                    </label>
                                    <select
                                        name="is_rural"
                                        value={profile.is_rural}
                                        onChange={onChange}
                                        className="input-round"
                                    >
                                        {boolOptions()}
                                    </select>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary flex-1"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Checking...
                                        </div>
                                    ) : (
                                        'Check Eligibility'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setProfile(initialProfile)}
                                    className="px-6 py-2.5 rounded-full border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Reset
                                </button>
                            </div>
                        </form>
                    </Card>

                    {/* Results Card */}
                    <Card className="p-0 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                Results
                            </h2>
                        </div>
                        
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/30 min-h-[400px]">
                            {error && (
                                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-medium">Error: {error}</span>
                                    </div>
                                </div>
                            )}

                            {result ? (
                                result.summary ? (
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Summary</h3>
                                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                            {result.summary}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                                 Eligible Schemes ({(result.eligible_schemes || []).length})
                                            </h3>
                                            {(result.eligible_schemes || []).length === 0 ? (
                                                <p className="text-slate-500 dark:text-slate-400">No exact matches found.</p>
                                            ) : (
                                                <div className="space-y-4">
                                                    {(result.eligible_schemes || []).map((scheme, idx) => (
                                                        <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                                            <div className="flex items-start justify-between mb-3">
                                                                <h4 className="font-semibold text-slate-900 dark:text-white text-lg">
                                                                    {scheme.scheme_name || scheme.scheme_id}
                                                                </h4>
                                                                <div className="flex items-center gap-2">
                                                                    {/* PDF Download Button */}
                                                                    <button
                                                                        onClick={() => downloadPDF(scheme.scheme_id)}
                                                                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors"
                                                                        title="Download Scheme PDF"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                        </svg>
                                                                        PDF
                                                                    </button>
                                                                    
                                                                    {/* Website Link Button */}
                                                                    {scheme.website_url && (
                                                                        <button
                                                                            onClick={() => openWebsite(scheme.website_url)}
                                                                            className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-full hover:bg-green-700 transition-colors"
                                                                            title="Visit Official Website"
                                                                        >
                                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                                                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                                                            </svg>
                                                                            Website
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Eligibility Reasons */}
                                                            {scheme.reasons && scheme.reasons.length > 0 && (
                                                                <div className="mb-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                                                                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-2">
                                                                        ✅ Why you're eligible:
                                                                    </p>
                                                                    <ul className="list-disc list-inside text-sm text-emerald-700 dark:text-emerald-300 space-y-1">
                                                                        {scheme.reasons.map((reason, idx) => (
                                                                            <li key={idx}>{reason}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            
                                                            {/* Required Documents */}
                                                            {scheme.required_documents && scheme.required_documents.length > 0 && (
                                                                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                                                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                                                                         Required Documents:
                                                                    </p>
                                                                    <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                                                        {scheme.required_documents.map((doc, idx) => (
                                                                            <li key={idx}>{doc}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            
                                                            {/* Next Steps */}
                                                            {scheme.next_steps && (
                                                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                                                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                                                                        🚀 Next Steps:
                                                                    </p>
                                                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                                                        {scheme.next_steps}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Near Misses Section */}
                                        {(result.near_misses || []).length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                                    ⚠️ Near Misses ({(result.near_misses || []).length})
                                                </h3>
                                                <div className="space-y-3">
                                                    {result.near_misses.map((miss, i) => (
                                                        <div key={i} className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                                {miss.scheme_id}
                                                            </div>
                                                            {miss.failed_conditions && miss.failed_conditions.length > 0 && (
                                                                <div className="text-xs text-slate-600 dark:text-slate-400">
                                                                    <span className="font-medium">Failed conditions:</span> {miss.failed_conditions.join(', ')}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400">
                                        Submit the form to see matched schemes here.
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
