'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'
import { FiArrowLeft, FiCheck, FiTrash2 } from 'react-icons/fi'
import {
  PERMISSION_ACTIONS,
  constrainApiPermissions,
  countEnabledActions,
  emptyActions,
  generateBrowserApiKeyPair,
  getApiPermissionResources,
  normalizeActions
} from '@/lib/apiIntegrations'
import ApiCredentials from './ApiCredentials'

const inputClass =
  'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-primary_color outline-none text-primary_color'

export default function ApiPermissionsDetail({ userType = 'developer', slug = 'default', apiId }) {
  const router = useRouter()
  const { developerToken, agencyToken } = useAuth()
  const token = userType === 'agency' ? agencyToken : developerToken
  const resources = useMemo(() => getApiPermissionResources(userType), [userType])
  const isCreate = apiId === 'new'

  const emptyPermissions = useMemo(
    () =>
      resources.reduce((acc, resource) => {
        acc[resource.id] = emptyActions()
        return acc
      }, {}),
    [resources]
  )

  const [loading, setLoading] = useState(!isCreate)
  const [saving, setSaving] = useState(false)
  const [key, setKey] = useState(null)
  const [secretKey, setSecretKey] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('active')
  const [permissions, setPermissions] = useState(emptyPermissions)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const justCreatedId = React.useRef(null)
  const draftGenerated = React.useRef(false)

  useEffect(() => {
    if (isCreate) {
      if (!draftGenerated.current) {
        const pair = generateBrowserApiKeyPair(userType)
        setKey({
          publishable_key: pair.publishableKey,
          secret_key_prefix: pair.secretKeyPrefix
        })
        setSecretKey(pair.secretKey)
        draftGenerated.current = true
      }
      setLoading(false)
      setPermissions((current) => (Object.keys(current).length ? current : emptyPermissions))
      return
    }

    if (!token || !apiId) return
    if (justCreatedId.current === apiId) {
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/api-keys/${apiId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'API key not found')
        const row = result.data
        setKey(row)
        setSecretKey(null)
        setName(row.name || '')
        setDescription(row.description || '')
        setStatus(row.status || 'active')
        setPermissions(constrainApiPermissions(row.permissions || emptyPermissions, userType))
      } catch (error) {
        toast.error(error.message)
        setKey(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token, apiId, isCreate, emptyPermissions])

  const toggleAction = (resourceId, actionId) => {
    const current = normalizeActions(permissions[resourceId])
    setPermissions({
      ...permissions,
      [resourceId]: {
        ...current,
        [actionId]: !current[actionId]
      }
    })
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    if ((isCreate || !key?.id) && (!secretKey || !key?.publishable_key)) {
      toast.error('Keys are missing. Refresh and try again.')
      return
    }
    setSaving(true)
    try {
      if (isCreate || !key?.id) {
        const response = await fetch('/api/api-keys', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            status,
            permissions: constrainApiPermissions(permissions, userType),
            publishable_key: key.publishable_key,
            secret_key: secretKey
          })
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Failed to create')
        const row = result.data
        setKey({
          ...row,
          publishable_key: key.publishable_key,
          secret_key_prefix: key.secret_key_prefix
        })
        setSecretKey(secretKey)
        justCreatedId.current = row.id
        toast.success('API key saved')
        router.replace(`/${userType}/${slug}/api/${row.id}`)
        return
      }

      const response = await fetch(`/api/api-keys/${key.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          status,
          permissions: constrainApiPermissions(permissions, userType)
        })
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to save')
      setKey({ ...result.data, secret_key: secretKey || undefined })
      toast.success('Changes saved')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!key?.id) {
      router.push(`/${userType}/${slug}/api`)
      return
    }
    try {
      const response = await fetch(`/api/api-keys/${key.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to delete')
      toast.success('API key deleted')
      router.push(`/${userType}/${slug}/api`)
    } catch (error) {
      toast.error(error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color" />
      </div>
    )
  }

  if (!isCreate && !key) {
    return (
      <div className="w-full">
        <Link href={`/${userType}/${slug}/api`} className="inline-flex items-center gap-2 text-gray-600 hover:text-primary_color mb-6">
          <FiArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="page_heading">API not found</h1>
      </div>
    )
  }

  return (
    <div className="w-full">
      <Link
        href={`/${userType}/${slug}/api`}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-primary_color mb-4"
      >
        <FiArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="page_heading">{name || (isCreate ? 'New API key' : key?.name)}</h1>
        <button
          type="button"
          onClick={() => setStatus(status === 'active' ? 'inactive' : 'active')}
          className="flex items-center gap-2 text-primary_color"
        >
          <span
            className={`relative w-9 h-5 rounded-full transition-colors ${
              status === 'active' ? 'bg-primary_color' : 'bg-primary_color/20'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                status === 'active' ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </span>
          <span className={status === 'active' ? 'text-primary_color font-medium' : 'text-primary_color/50'}>
            {status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </button>
      </div>

      <div className="bg-white/40 border border-gray-200 rounded-xl p-6 mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="API name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
            placeholder="What this key is used for"
          />
        </div>
        {key?.publishable_key && (
          <>
            {secretKey && (
              <p className="text-gray-600">
                Copy both keys before you leave this page. The secret will not be shown again after you leave.
              </p>
            )}
            <ApiCredentials
              publishableKey={key.publishable_key}
              secretKey={secretKey}
              secretKeyPrefix={key.secret_key_prefix}
              revealSecret={!!secretKey}
              showSecretPlain={!!secretKey}
            />
          </>
        )}
      </div>

      <div className="space-y-4 mb-6">
        {resources.map((resource) => {
          const actions = normalizeActions(permissions[resource.id])
          const enabledCount = countEnabledActions(actions)

          return (
            <section key={resource.id} className="w-full bg-white/40 border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-primary_color">{resource.name}</p>
                  {resource.summary && (
                    <p className="text-sm text-gray-600 mt-1">{resource.summary}</p>
                  )}
                </div>
                <p className="text-gray-600">{enabledCount} of {(resource.allowedActions || PERMISSION_ACTIONS.map((a) => a.id)).length}</p>
              </div>

              <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                {PERMISSION_ACTIONS.filter((action) =>
                  (resource.allowedActions || []).includes(action.id)
                ).map((action) => {
                  const on = !!actions[action.id]
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => toggleAction(resource.id, action.id)}
                      className="flex items-center gap-2 text-primary_color"
                    >
                      <span
                        className={`flex items-center justify-center w-4 h-4 rounded-[3px] border-2 ${
                          on ? 'bg-primary_color border-primary_color' : 'bg-white border-primary_color/30'
                        }`}
                      >
                        {on && <FiCheck className="w-3 h-3 text-white" />}
                      </span>
                      <span
                        className={`relative w-9 h-5 rounded-full transition-colors ${
                          on ? 'bg-primary_color' : 'bg-primary_color/20'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                            on ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </span>
                      <span className={on ? 'text-primary_color font-medium' : 'text-primary_color/60'}>
                        {action.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {isCreate && !key?.id ? (
          <span />
        ) : confirmDelete ? (
          <div className="flex items-center gap-2">
            <p className="text-gray-600">Delete this API key?</p>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Confirm delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
          >
            <FiTrash2 className="w-4 h-4" />
            Delete
          </button>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-primary_color text-white rounded-lg hover:bg-primary_color/90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : isCreate && !key?.id ? 'Save' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
