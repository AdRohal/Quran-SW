import { useContext } from 'react'
import { LiveContext } from '../contexts/LiveContext'

export function useLive() {
  const context = useContext(LiveContext)
  if (!context) {
    throw new Error('useLive must be used within LiveProvider')
  }
  return context
}
