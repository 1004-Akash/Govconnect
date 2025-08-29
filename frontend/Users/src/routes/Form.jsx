import React, { useState } from 'react';
import './Form.css';
import axios from 'axios';

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
            const { data } = await axios.post(`${BACKEND_URL}/govmatch/govmatch/check`, payload);
            setResult(data);
        } catch (err) {
            const msg = err?.response?.data?.detail || err.message || 'Request failed';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const muted = { color: '#6b7280', fontSize: '14px' };

    return (
        <div className="form-container">
            <div className="form-header">
                <h2>GovMatch Eligibility</h2>
                <p style={muted}>Provide your details to discover matching government schemes.</p>
            </div>

            <div className="form-layout">
                <div className="form-card">
                    <div className="form-card__section form-card__section--header">
                        <h3 className="form-card__title">Your Details</h3>
                    </div>
                    <form onSubmit={onSubmit} className="form-card__section form-grid">
                        <div className="form-field"><label className="form-label">Age</label><input className="form-input" name="age" type="number" value={profile.age} onChange={onChange} /></div>
                        <div className="form-field"><label className="form-label">Gender</label><select className="form-select" name="gender" value={profile.gender} onChange={onChange}><option value="">--</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                        <div className="form-field"><label className="form-label">Occupation</label><input className="form-input" name="occupation" value={profile.occupation} onChange={onChange} /></div>
                        <div className="form-field"><label className="form-label">Student</label><select className="form-select" name="is_student" value={profile.is_student} onChange={onChange}>{boolOptions()}</select></div>
                        <div className="form-field"><label className="form-label">Annual Income</label><input className="form-input" name="income" type="number" value={profile.income} onChange={onChange} /></div>
                        <div className="form-field"><label className="form-label">Caste</label><input className="form-input" name="caste" value={profile.caste} onChange={onChange} /></div>
                        <div className="form-field"><label className="form-label">State</label><input className="form-input" name="state" value={profile.state} onChange={onChange} /></div>
                        <div className="form-field"><label className="form-label">District</label><input className="form-input" name="district" value={profile.district} onChange={onChange} /></div>
                        <div className="form-field"><label className="form-label">Has Land</label><select className="form-select" name="has_land" value={profile.has_land} onChange={onChange}>{boolOptions()}</select></div>
                        <div className="form-field"><label className="form-label">Land Size (acres)</label><input className="form-input" name="land_size_acres" type="number" step="0.01" value={profile.land_size_acres} onChange={onChange} /></div>
                        <div className="form-field"><label className="form-label">Farmer</label><select className="form-select" name="is_farmer" value={profile.is_farmer} onChange={onChange}>{boolOptions()}</select></div>
                        <div className="form-field"><label className="form-label">Marginal Farmer</label><select className="form-select" name="is_marginal_farmer" value={profile.is_marginal_farmer} onChange={onChange}>{boolOptions()}</select></div>
                        <div className="form-field"><label className="form-label">Government Job</label><select className="form-select" name="has_government_job" value={profile.has_government_job} onChange={onChange}>{boolOptions()}</select></div>
                        <div className="form-field"><label className="form-label">Unemployed</label><select className="form-select" name="is_unemployed" value={profile.is_unemployed} onChange={onChange}>{boolOptions()}</select></div>
                        <div className="form-field"><label className="form-label">Bank Account</label><select className="form-select" name="has_bank_account" value={profile.has_bank_account} onChange={onChange}>{boolOptions()}</select></div>
                        <div className="form-field"><label className="form-label">Married</label><select className="form-select" name="is_married" value={profile.is_married} onChange={onChange}>{boolOptions()}</select></div>
                        <div className="form-field"><label className="form-label">Family Size</label><input className="form-input" name="family_size" type="number" value={profile.family_size} onChange={onChange} /></div>
                        <div className="form-field"><label className="form-label">Widow</label><select className="form-select" name="is_widow" value={profile.is_widow} onChange={onChange}>{boolOptions()}</select></div>
                        <div className="form-field"><label className="form-label">Disabled</label><select className="form-select" name="is_disabled" value={profile.is_disabled} onChange={onChange}>{boolOptions()}</select></div>
                        <div className="form-field"><label className="form-label">Rural</label><select className="form-select" name="is_rural" value={profile.is_rural} onChange={onChange}>{boolOptions()}</select></div>
                        <div className="form-actions">
                            <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Checking…' : 'Check Eligibility'}</button>
                            <button type="button" onClick={() => setProfile(initialProfile)} className="btn btn-secondary">Reset</button>
                        </div>
                    </form>
                </div>

                <div className="form-card">
                    <div className="form-card__section form-card__section--header">
                        <h3 className="form-card__title">Results</h3>
                    </div>
                    <div className="form-card__section results-panel">
                        {error && (
                            <div className="results-error">Error: {error}</div>
                        )}
                        {result ? (
                            result.summary ? (
                                <div className="results-box">
                                    {result.summary}
                                </div>
                            ) : (
                                <div>
                                    <div style={{ marginBottom: '12px' }}>
                                        <h4 className="results-subtitle">Matched Schemes</h4>
                                        {(result.eligible_schemes || []).length === 0 && <p className="results-muted">No exact matches.</p>}
                                        <ul className="results-list">
                                            {(result.eligible_schemes || []).map((s, idx) => (
                                                <li key={idx}>
                                                    <strong>{s.scheme_name || s.scheme_id}</strong><br />
                                                    {s.reasons && s.reasons.length > 0 && (
                                                        <small>Reasons: {s.reasons.join('; ')}</small>
                                                    )}
                                                    {s.required_documents && s.required_documents.length > 0 && (
                                                        <div><small>Documents: {s.required_documents.join(', ')}</small></div>
                                                    )}
                                                    {s.next_steps && <div><small>Next: {s.next_steps}</small></div>}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    {(result.near_misses || []).length > 0 && (
                                        <div>
                                            <h4 className="results-subtitle" style={{ marginTop: '16px' }}>Near Misses</h4>
                                            <ul className="results-list">
                                                {result.near_misses.map((n, i) => (
                                                    <li key={i}>{n.scheme_id}: {n.failed_conditions?.join(', ')}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )
                        ) : (
                            <p className="results-muted">Submit the form to see matched schemes here.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
