'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/app/components/ui/input'

/**
 * Reusable address fields: country, state, city, town, fullAddress.
 * Uses same GeoNames API as DevelopmentLocation. No map/coordinates.
 * @param {Object} value - { country, state, city, town, fullAddress }
 * @param {Function} onChange - (address) => void
 * @param {boolean} required - whether fields are required
 */
const AddressFields = ({ value = {}, onChange, required = false }) => {
  const [address, setAddress] = useState({
    country: value?.country || '',
    state: value?.state || '',
    city: value?.city || '',
    town: value?.town || '',
    fullAddress: value?.fullAddress || ''
  })

  const [countries, setCountries] = useState([])
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])
  const [towns, setTowns] = useState([])
  const [loading, setLoading] = useState({
    countries: false,
    states: false,
    cities: false,
    towns: false
  })

  useEffect(() => {
    if (value && (value.country !== address.country || value.state !== address.state || value.city !== address.city || value.town !== address.town || value.fullAddress !== address.fullAddress)) {
      setAddress({
        country: value.country || '',
        state: value.state || '',
        city: value.city || '',
        town: value.town || '',
        fullAddress: value.fullAddress || ''
      })
    }
  }, [value?.country, value?.state, value?.city, value?.town, value?.fullAddress])

  useEffect(() => {
    const fetchCountries = async () => {
      setLoading(prev => ({ ...prev, countries: true }))
      try {
        const response = await fetch('http://api.geonames.org/countryInfoJSON?username=iskahomes')
        if (response.ok) {
          const data = await response.json()
          const list = (data.geonames || []).map(c => ({
            name: c.countryName,
            code: c.countryCode,
            geonameId: c.geonameId
          })).sort((a, b) => a.name.localeCompare(b.name))
          setCountries(list)
        }
      } catch (e) {
        console.error('Error fetching countries:', e)
      } finally {
        setLoading(prev => ({ ...prev, countries: false }))
      }
    }
    fetchCountries()
  }, [])

  useEffect(() => {
    if (!address.country) {
      setStates([])
      setCities([])
      setTowns([])
      return
    }
    const c = countries.find(x => x.name === address.country)
    if (!c?.geonameId) return
    setLoading(prev => ({ ...prev, states: true }))
    fetch(`http://api.geonames.org/childrenJSON?geonameId=${c.geonameId}&username=iskahomes`)
      .then(r => r.json())
      .then(data => {
        const list = (data.geonames || []).map(s => ({ name: s.name, code: s.geonameId })).sort((a, b) => a.name.localeCompare(b.name))
        setStates(list)
      })
      .catch(e => console.error('Error fetching states:', e))
      .finally(() => setLoading(prev => ({ ...prev, states: false })))
  }, [address.country, countries])

  useEffect(() => {
    if (!address.state) {
      setCities([])
      setTowns([])
      return
    }
    const s = states.find(x => x.name === address.state)
    if (!s?.code) return
    setLoading(prev => ({ ...prev, cities: true }))
    fetch(`http://api.geonames.org/childrenJSON?geonameId=${s.code}&username=iskahomes`)
      .then(r => r.json())
      .then(data => {
        const list = (data.geonames || []).map(c => ({ name: c.name, code: c.geonameId })).sort((a, b) => a.name.localeCompare(b.name))
        setCities(list)
      })
      .catch(e => console.error('Error fetching cities:', e))
      .finally(() => setLoading(prev => ({ ...prev, cities: false })))
  }, [address.state, states])

  useEffect(() => {
    if (!address.city) {
      setTowns([])
      return
    }
    const c = cities.find(x => x.name === address.city)
    if (!c?.code) return
    setLoading(prev => ({ ...prev, towns: true }))
    fetch(`http://api.geonames.org/childrenJSON?geonameId=${c.code}&username=iskahomes`)
      .then(r => r.json())
      .then(data => {
        const list = (data.geonames || []).map(t => ({ name: t.name, code: t.geonameId })).sort((a, b) => a.name.localeCompare(b.name))
        setTowns(list)
      })
      .catch(e => console.error('Error fetching towns:', e))
      .finally(() => setLoading(prev => ({ ...prev, towns: false })))
  }, [address.city, cities])

  const update = (field, val) => {
    let next = { ...address, [field]: val }
    if (field === 'country') next = { ...next, state: '', city: '', town: '' }
    else if (field === 'state') next = { ...next, city: '', town: '' }
    else if (field === 'city') next = { ...next, town: '' }
    setAddress(next)
    onChange?.(next)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="address-country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <select
            id="address-country"
            value={address.country}
            onChange={e => update('country', e.target.value)}
            required={required}
            className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary_color/30 bg-background"
          >
            <option value="">Select country</option>
            {loading.countries ? <option disabled>Loading...</option> : countries.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="address-state" className="block text-sm font-medium text-gray-700 mb-1">State / Region</label>
          <select
            id="address-state"
            value={address.state}
            onChange={e => update('state', e.target.value)}
            disabled={!address.country}
            className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary_color/30 bg-background disabled:opacity-60"
          >
            <option value="">Select state</option>
            {loading.states ? <option disabled>Loading...</option> : states.map(s => <option key={s.code} value={s.name}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="address-city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <select
            id="address-city"
            value={address.city}
            onChange={e => update('city', e.target.value)}
            disabled={!address.state}
            className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary_color/30 bg-background disabled:opacity-60"
          >
            <option value="">Select city</option>
            {loading.cities ? <option disabled>Loading...</option> : cities.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="address-town" className="block text-sm font-medium text-gray-700 mb-1">Town / Area</label>
          <select
            id="address-town"
            value={address.town}
            onChange={e => update('town', e.target.value)}
            disabled={!address.city}
            className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary_color/30 bg-background disabled:opacity-60"
          >
            <option value="">Select town</option>
            {loading.towns ? <option disabled>Loading...</option> : towns.map(t => <option key={t.code} value={t.name}>{t.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="address-full" className="block text-sm font-medium text-gray-700 mb-1">Full address</label>
        <Input
          id="address-full"
          type="text"
          placeholder="Street, building, landmark..."
          value={address.fullAddress}
          onChange={e => update('fullAddress', e.target.value)}
          className="w-full"
        />
      </div>
    </div>
  )
}

export default AddressFields
