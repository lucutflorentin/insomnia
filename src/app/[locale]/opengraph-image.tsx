import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Insomnia Tattoo — Studio Premium Tatuaje Mamaia Nord';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0A0A0A',
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(176,176,176,0.08) 0%, transparent 60%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: '#B0B0B0',
              letterSpacing: '-2px',
            }}
          >
            INSOMNIA
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 300,
              color: '#888888',
              letterSpacing: '12px',
              textTransform: 'uppercase' as const,
            }}
          >
            TATTOO
          </div>
          <div
            style={{
              width: 80,
              height: 1,
              backgroundColor: '#B0B0B0',
              marginTop: 24,
              marginBottom: 24,
            }}
          />
          <div
            style={{
              fontSize: 18,
              color: '#666666',
              letterSpacing: '4px',
              textTransform: 'uppercase' as const,
            }}
          >
            Mamaia Nord, Constanta
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
