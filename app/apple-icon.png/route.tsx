import { ImageResponse } from '@vercel/og'

export async function GET() {
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
          borderRadius: '120px',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: '290px',
            fontWeight: 900,
            fontFamily: 'sans-serif',
            letterSpacing: '-6px',
          }}
        >
          K
        </span>
      </div>
    ),
    { width: 512, height: 512 }
  )
}
