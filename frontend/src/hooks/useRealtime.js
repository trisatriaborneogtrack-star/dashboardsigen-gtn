import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchRealtime } from '../api/client'

const POLL_INTERVAL = 5000 // 5 seconds

export function useRealtime(systemId) {
  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [countdown, setCountdown] = useState(5)
  const timerRef   = useRef(null)
  const countRef   = useRef(null)

  const fetchData = useCallback(() => {
    if (!systemId) return
    fetchRealtime(systemId)
      .then(res => {
        setData(res.data)
        setError(null)
        setCountdown(5)
      })
      .catch(err => {
        setError(err.response?.data?.error || err.message)
      })
      .finally(() => setLoading(false))
  }, [systemId])

  useEffect(() => {
    if (!systemId) return
    setLoading(true)
    setData(null)
    fetchData()

    timerRef.current = setInterval(fetchData, POLL_INTERVAL)

    countRef.current = setInterval(() => {
      setCountdown(c => (c <= 1 ? 5 : c - 1))
    }, 1000)

    return () => {
      clearInterval(timerRef.current)
      clearInterval(countRef.current)
    }
  }, [systemId, fetchData])

  return { data, loading, error, countdown }
}
