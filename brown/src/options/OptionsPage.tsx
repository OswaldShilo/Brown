import { useEffect, useState } from 'react'
import { getApiKey, setApiKey } from './storage'

export function OptionsPage() {
  const [key, setKey] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getApiKey().then(existing => setKey(existing ?? ''))
  }, [])

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24, maxWidth: 480 }}>
      <h1>Brown Settings</h1>
      <label htmlFor="gemini-key">Gemini API key</label>
      <input
        id="gemini-key"
        type="password"
        value={key}
        onChange={e => {
          setKey(e.target.value)
          setSaved(false)
        }}
        style={{ display: 'block', width: '100%', marginTop: 4, marginBottom: 8 }}
      />
      <button
        onClick={async () => {
          await setApiKey(key)
          setSaved(true)
        }}
      >
        Save
      </button>
      {saved && <p>Saved.</p>}
    </div>
  )
}
