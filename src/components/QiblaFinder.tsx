import { useState, useEffect, useRef } from 'react'
import { X, MapPin, Navigation } from 'lucide-react'

interface QiblaFinderProps {
  isOpen: boolean
  onClose: () => void
}

const MECCA_LAT = 21.4225
const MECCA_LON = 39.8262

export function QiblaFinder({ isOpen, onClose }: QiblaFinderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calculate Qibla direction using haversine formula
  const calculateQibla = (userLat: number, userLon: number): number => {
    const lat1 = (userLat * Math.PI) / 180
    const lat2 = (MECCA_LAT * Math.PI) / 180
    const dLon = ((MECCA_LON - userLon) * Math.PI) / 180

    const y = Math.sin(dLon) * Math.cos(lat2)
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)

    const bearing = (Math.atan2(y, x) * 180) / Math.PI
    return (bearing + 360) % 360
  }

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  useEffect(() => {
    if (!isOpen) return

    setLoading(true)
    setError(null)

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lon: longitude })
          const direction = calculateQibla(latitude, longitude)
          setQiblaDirection(direction)
          setLoading(false)
        },
        (err) => {
          setError('Unable to get your location. Please enable location services.')
          setLoading(false)
          console.error(err)
        }
      )
    } else {
      setError('Geolocation is not supported by your browser.')
      setLoading(false)
    }
  }, [isOpen])

  // Draw the map
  useEffect(() => {
    if (!canvasRef.current || !userLocation || qiblaDirection === null) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 2 - 40

    // Clear canvas
    ctx.fillStyle = '#f8f9fa'
    ctx.fillRect(0, 0, width, height)

    // Draw compass circle
    ctx.strokeStyle = '#0d766e'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.stroke()

    // Draw cardinal directions
    ctx.fillStyle = '#0d766e'
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI"'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    ctx.fillText('N', centerX, centerY - radius - 20)
    ctx.fillText('E', centerX + radius + 20, centerY)
    ctx.fillText('S', centerX, centerY + radius + 20)
    ctx.fillText('W', centerX - radius - 20, centerY)

    // Draw degree markers
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 1
    for (let i = 0; i < 360; i += 10) {
      const angle = (i * Math.PI) / 180
      const x1 = centerX + Math.sin(angle) * radius
      const y1 = centerY - Math.cos(angle) * radius
      const x2 = centerX + Math.sin(angle) * (radius + 10)
      const y2 = centerY - Math.cos(angle) * (radius + 10)
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }

    // Draw Qibla direction arrow
    const qiblaRad = (qiblaDirection * Math.PI) / 180
    const arrowLength = radius * 0.8
    const arrowX = centerX + Math.sin(qiblaRad) * arrowLength
    const arrowY = centerY - Math.cos(qiblaRad) * arrowLength

    // Draw arrow line
    ctx.strokeStyle = '#e74c3c'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(arrowX, arrowY)
    ctx.stroke()

    // Draw arrow head
    const headlen = 20
    const angle1 = qiblaRad - Math.PI / 6
    const angle2 = qiblaRad + Math.PI / 6

    ctx.fillStyle = '#e74c3c'
    ctx.beginPath()
    ctx.moveTo(arrowX, arrowY)
    ctx.lineTo(arrowX - headlen * Math.cos(angle1), arrowY + headlen * Math.sin(angle1))
    ctx.lineTo(arrowX - headlen * Math.cos(angle2), arrowY + headlen * Math.sin(angle2))
    ctx.closePath()
    ctx.fill()

    // Draw user location indicator
    ctx.fillStyle = '#0d766e'
    ctx.beginPath()
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI)
    ctx.fill()

    // Draw Mecca indicator
    ctx.fillStyle = '#27ae60'
    ctx.beginPath()
    ctx.arc(arrowX, arrowY, 6, 0, 2 * Math.PI)
    ctx.fill()
  }, [userLocation, qiblaDirection])

  if (!isOpen) return null

  const distance = userLocation ? calculateDistance(userLocation.lat, userLocation.lon, MECCA_LAT, MECCA_LON) : 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-teal-700 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Navigation className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Qibla Finder</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-teal-200 border-t-teal-700 rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Getting your location...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <p className="text-red-700">{error}</p>
            </div>
          ) : userLocation && qiblaDirection !== null ? (
            <>
              {/* Compass Canvas */}
              <div className="flex justify-center mb-8">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={400}
                  className="border-4 border-teal-200 rounded-2xl shadow-lg"
                />
              </div>

              {/* Information Cards */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-teal-700" />
                    <p className="text-sm font-semibold text-gray-600">Qibla Direction</p>
                  </div>
                  <p className="text-3xl font-bold text-teal-700">{qiblaDirection.toFixed(1)}°</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {qiblaDirection < 90 && 'Northeast'}
                    {qiblaDirection >= 90 && qiblaDirection < 180 && 'Southeast'}
                    {qiblaDirection >= 180 && qiblaDirection < 270 && 'Southwest'}
                    {qiblaDirection >= 270 && 'Northwest'}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation className="w-5 h-5 text-blue-700" />
                    <p className="text-sm font-semibold text-gray-600">Distance to Mecca</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-700">{distance.toFixed(0)} km</p>
                  <p className="text-xs text-gray-500 mt-1">Approximate distance</p>
                </div>
              </div>

              {/* Location Details */}
              <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                <h3 className="font-bold text-gray-800">Your Location</h3>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Latitude</p>
                    <p className="font-mono text-gray-800">{userLocation.lat.toFixed(4)}°</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Longitude</p>
                    <p className="font-mono text-gray-800">{userLocation.lon.toFixed(4)}°</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-4">Mecca Location</h3>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Latitude</p>
                      <p className="font-mono text-gray-800">{MECCA_LAT.toFixed(4)}°</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Longitude</p>
                      <p className="font-mono text-gray-800">{MECCA_LON.toFixed(4)}°</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <p className="text-sm font-semibold text-gray-800 mb-3">Legend</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span className="text-gray-700">Qibla direction (red arrow)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-teal-700"></div>
                    <span className="text-gray-700">Your location (center)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-gray-700">Mecca location</span>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
