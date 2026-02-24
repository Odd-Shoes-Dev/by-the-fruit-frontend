import { useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ''

export default function BusinessProfileForm({ initial = {}, onSave }) {
    const [name, setName] = useState('')
    const [category, setCategory] = useState('')
    const [description, setDescription] = useState('')
    const [address, setAddress] = useState('')
    const [city, setCity] = useState('')
    const [country, setCountry] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [website, setWebsite] = useState('')
    const [status, setStatus] = useState(null)
    const [error, setError] = useState('')

    async function handleSubmit(e) {
        e.preventDefault()
        setStatus('saving')
        setError('')

        const payload = {
            user: initial.user,
            name,
            category,
            description,
            address,
            city,
            country,
            phone,
            email,
            website,
            is_verified: false
        }

        try {
            const token = typeof window !== 'undefined'
                ? (localStorage.getItem('btf_token') || localStorage.getItem('btf_pending_token'))
                : null
            const headers = { 'Content-Type': 'application/json' }
            if (token) headers['Authorization'] = `Token ${token}`

            const res = await fetch(`${API_BASE}/profiles/businesses/`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                const data = await res.json()
                console.log('Business Profile creation response:', data)
                setStatus('saved')
                onSave && onSave(data)
                return
            }

            const errData = await res.json().catch(() => ({}))
            console.error('Business Profile creation error:', errData)
            setError(errData?.error || 'Failed to save business profile.')
            setStatus(null)
        } catch (err) {
            console.error('Business Profile network error:', err)
            setError('Network error — please try again.')
            setStatus(null)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="form">
            <label>Business Name
                <input value={name} onChange={e => setName(e.target.value)} required />
            </label>

            <label>Category
                <select value={category} onChange={e => setCategory(e.target.value)} required>
                    <option value="">— Select a category —</option>
                    <option value="technology">Technology</option>
                    <option value="finance">Finance</option>
                    <option value="retail">Retail</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="education">Education</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="agriculture">Agriculture</option>
                    <option value="real_estate">Real Estate</option>
                    <option value="hospitality">Hospitality</option>
                    <option value="logistics">Logistics</option>
                    <option value="other">Other</option>
                </select>
            </label>

            <label>Description
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Sustainable farming solutions for modern Africa." required />
            </label>

            <h4 style={{ marginTop: 16, marginBottom: 8 }}>Contact &amp; Location</h4>
            <label>Country
                <input value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g., Uganda" />
            </label>
            <label>City
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g., Kampala" />
            </label>
            <label>Address
                <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} placeholder="Street address" />
            </label>
            <label>Phone
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+256700000000" />
            </label>
            <label>Email
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@example.com" />
            </label>
            <label>Website
                <input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" />
            </label>

            {error && <div style={{ color: 'var(--danger, red)', marginTop: 8, fontSize: '0.9rem' }}>{error}</div>}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button type="submit" className="btn" disabled={status === 'saving'}>Save Profile</button>
                <div style={{ alignSelf: 'center' }}>{status === 'saving' ? 'Saving...' : ''}</div>
            </div>
        </form>
    )
}
