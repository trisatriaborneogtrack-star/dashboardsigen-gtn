import { useState, useEffect, useCallback } from 'react'
import { fetchHistory } from '../api/client'

export function useHistory(systemId, days = 7) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = useCallback(() => {
    if (!systemId) return
    setLoading(true)
    // Use 'Month' level to get enough data points for 7/14/30 day views
    fetchHistory(systemId, { days, level: 'Month' })
      .then(res => { setData(res.data); setError(null) })
      .catch(err => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false))
  }, [systemId, days])

  useEffect(() => { load() }, [load])

  return { data, loading, error, reload: load }
}
