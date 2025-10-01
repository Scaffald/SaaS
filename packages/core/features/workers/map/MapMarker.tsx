import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import mapboxgl from 'mapbox-gl'
import type { TalentMarker } from './types'

interface MapMarkerProps {
  marker: TalentMarker
  map: mapboxgl.Map
  isSelected: boolean
  onSelect: (id: string) => void
}

export const MapMarker = ({ marker, map, isSelected, onSelect }: MapMarkerProps) => {
  const contentRef = useRef(document.createElement('div'))
  const markerRef = useRef<mapboxgl.Marker | null>(null)

  useEffect(() => {
    markerRef.current = new mapboxgl.Marker(contentRef.current)
      .setLngLat(marker.coordinate)
      .addTo(map)

    return () => {
      markerRef.current?.remove()
    }
  }, [map, marker.coordinate])

  // Get colors based on availability
  const getColors = () => {
    switch (marker.availability) {
      case 'available':
        return { bg: '#10B981', border: '#047857' }
      case 'unavailable':
        return { bg: '#EF4444', border: '#DC2626' }
      default:
        return { bg: '#3B82F6', border: '#1E40AF' }
    }
  }

  const colors = getColors()
  const bgGradient = isSelected
    ? 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)'
    : `linear-gradient(135deg, ${colors.bg} 0%, ${colors.border} 100%)`

  const pinSize = isSelected ? '52px' : '48px'
  const iconSize = isSelected ? '24' : '22'

  return (
    <>
      {createPortal(
        <button
          type="button"
          onClick={() => onSelect(marker.id)}
          aria-label={`Select ${marker.title}`}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            transform: 'translate(-50%, -100%)',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: isSelected ? '10' : '1',
            background: 'none',
            border: 'none',
            padding: 0,
          }}
        >
          {/* Pin Container */}
          <div
            style={{
              position: 'relative',
              width: pinSize,
              height: pinSize,
              borderRadius: '24px 24px 24px 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: bgGradient,
              boxShadow: isSelected
                ? '0 8px 32px rgba(59, 130, 246, 0.4), 0 0 0 3px rgba(59, 130, 246, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.8)'
                : '0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 2px rgba(255, 255, 255, 0.8)',
              transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Score Badge */}
            <div
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                width: '20px',
                height: '20px',
                borderRadius: '10px',
                background: '#1F2937',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #FFFFFF',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              }}
            >
              {marker.score}
            </div>

            {/* Icon */}
            <svg
              width={iconSize}
              height={iconSize}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{
                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
              }}
            >
              {marker.organization === 'Organization' ? (
                <>
                  <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                  <path d="M6 12H4a2 2 0 0 0-2 2v8h20v-8a2 2 0 0 0-2-2h-2" />
                  <path d="M18 9v3" />
                  <path d="M13 9v3" />
                  <path d="M9 9v3" />
                  <path d="M9 18h6" />
                </>
              ) : (
                <>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </>
              )}
            </svg>
          </div>

          {/* Hourly Rate Badge */}
          {marker.hourlyRate && (
            <div
              style={{
                position: 'absolute',
                bottom: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#FFFFFF',
                color: colors.border,
                fontSize: '9px',
                fontWeight: '600',
                padding: '2px 6px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                whiteSpace: 'nowrap',
              }}
            >
              ${marker.hourlyRate}/hr
            </div>
          )}
        </button>,
        contentRef.current
      )}
    </>
  )
}
