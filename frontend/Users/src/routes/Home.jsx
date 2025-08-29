import React, { useState } from 'react';

function Home() {
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

    const handleChange = e => {
        const { name, value, type, files } = e.target;
        setForm(f => ({
            ...f,
            [name]: type === 'file' ? files[0] : value
        }));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        const data = new FormData();
        Object.entries(form).forEach(([k, v]) => {
            if (v !== null && v !== undefined && v !== '') data.append(k, v);
        });
        await fetch('http://localhost:8000/civicpulse/reports', {
            method: 'POST',
            body: data
        });
        setSuccess(true);
        setForm({ text: '', lat: '', lon: '', severity_tag: 0.5, category: 'General', infra_age: '', rainfall: '', image: null });
    };

    return (
        <div style={{ maxWidth: 500, margin: '2rem auto' }}>
            <h1>Welcome to CivicPulse</h1>
            <p>
                Use this portal to report civic issues in your area. Please fill out the form below with accurate details. Your report will help local authorities take action.
            </p>
            <hr style={{ margin: '2rem 0' }} />
            <h2>Report a Civic Issue</h2>
            {success && <div style={{ color: 'green' }}>Your issue has been submitted!</div>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Description:</label><br/>
                    <textarea name="text" value={form.text} onChange={handleChange} required />
                </div>
                <div>
                    <label>Latitude:</label><br/>
                    <input name="lat" type="number" value={form.lat} onChange={handleChange} required />
                </div>
                <div>
                    <label>Longitude:</label><br/>
                    <input name="lon" type="number" value={form.lon} onChange={handleChange} required />
                </div>
                <div>
                    <label>Severity (0-1):</label><br/>
                    <input name="severity_tag" type="number" min="0" max="1" step="0.01" value={form.severity_tag} onChange={handleChange} required />
                </div>
                <div>
                    <label>Category:</label><br/>
                    <select name="category" value={form.category} onChange={handleChange}>
                        <option value="General">General</option>
                        <option value="Water Issue">Water Issue</option>
                        <option value="Road Issue">Road Issue</option>
                        <option value="Garbage Issue">Garbage Issue</option>
                    </select>
                </div>
                <div>
                    <label>Infrastructure Age (years):</label><br/>
                    <input name="infra_age" type="number" value={form.infra_age} onChange={handleChange} />
                </div>
                <div>
                    <label>Rainfall (mm):</label><br/>
                    <input name="rainfall" type="number" value={form.rainfall} onChange={handleChange} />
                </div>
                <div>
                    <label>Image (optional):</label><br/>
                    <input name="image" type="file" accept="image/*" onChange={handleChange} />
                </div>
                <button type="submit">Submit Issue</button>
            </form>
        </div>
    );
}

export default Home;
