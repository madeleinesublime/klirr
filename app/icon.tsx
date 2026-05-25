import { ImageResponse } from '@vercel/og'

export const size = { width: 192, height: 192 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '44px',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: '110px',
            fontWeight: 900,
            fontFamily: 'sans-serif',
            letterSpacing: '-2px',
          }}
        >
          K
        </span>
      </div>
    ),
    { ...size }
  )
}
