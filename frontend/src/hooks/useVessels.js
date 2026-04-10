import { useState, useEffect } from 'react'
import { fetchVessels } from '../api/client'

export function useVessels() {
  const [vessels, setVessels]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error,   setError]     = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchVessels()
      .then(res => {
        if (!cancelled) {
          setVessels(res.data || [])
          setError(null)
        }
      })
      .catch(err => {
        if (!cancelled) setError(err.response?.data?.error || err.message)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { vessels, loading, error }
}
