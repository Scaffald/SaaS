interface PinMarkerProps {
  color?: string
  tooltip?: string
}

/**
 * Pin marker SVG component extracted from /map example
 * Used for custom HTML markers on web maps
 */
export const PinMarker = ({ color, tooltip }: PinMarkerProps) => {
  return (
    <div
      id="elevate-marker"
      role="img"
      aria-label={tooltip || 'Map pin marker'}
      style={{
        transformOrigin: 'bottom',
        transition: 'transform 200ms ease-in-out',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.25)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      {tooltip && (
        <div
          id="elevate-marker-tooltip"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            padding: '4px 8px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {tooltip}
        </div>
      )}
      <svg
        role="img"
        width="32"
        height="37"
        viewBox="0 0 32 37"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Pin Icon</title>
        <g filter="url(#filter0_dd_1546_3799)">
          <path
            d="M25.1924 26.1924C30.2692 21.1156 30.2692 12.8844 25.1924 7.80761C20.1156 2.7308 11.8844 2.7308 6.80761 7.80761C1.73081 12.8844 1.7308 21.1156 6.80757 26.1924L14.5857 33.9706C15.3668 34.7516 16.6331 34.7516 17.4142 33.9706L25.1698 26.2149C25.1774 26.2074 25.1849 26.1999 25.1924 26.1924Z"
            fill="white"
          />
        </g>
        <rect x="5" y="6.5" width="22" height="22" rx="11" fill={color || '#22C55E'} />
        <defs>
          <filter
            id="filter0_dd_1546_3799"
            x="0"
            y="0"
            width="32"
            height="36.5562"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset />
            <feGaussianBlur stdDeviation="0.5" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.4 0" />
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1546_3799" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="-1" />
            <feGaussianBlur stdDeviation="1.5" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.32 0" />
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect2_dropShadow_1546_3799" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect2_dropShadow_1546_3799"
              result="shape"
            />
          </filter>
        </defs>
      </svg>
    </div>
  )
}
