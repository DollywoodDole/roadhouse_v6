'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const router = useRouter();

  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [unregistered, setUnregistered] = useState(false);

  // Wallet connect → POST /api/auth/wallet → redirect or show recovery UI
  useEffect(() => {
    if (!connected || !publicKey) return;

    setLoading(true);
    setError(null);
    setUnregistered(false);

    fetch('/api/auth/wallet', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ publicKey: publicKey.toBase58() }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        if (data.isMember) {
          router.replace('/dashboard');
        } else {
          // Wallet connected but not linked to a subscription — show recovery UI
          setLoading(false);
          setUnregistered(true);
        }
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
        disconnect();
      });
  }, [connected, publicKey, router, disconnect]);

  return (
    <div
      style={{
        minHeight:      '100vh',
        background:     '#080808',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '2rem',
        fontFamily:     '"Space Mono", monospace',
      }}
    >
      {/* Top rule */}
      <div style={{
        position:   'fixed',
        top:        0,
        left:       0,
        right:      0,
        height:     '1px',
        background: 'linear-gradient(90deg, transparent, #C9A84C40, transparent)',
      }} />

      {/* Wordmark */}
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <p style={{
          fontFamily:    '"Bebas Neue", sans-serif',
          fontSize:      '2rem',
          letterSpacing: '0.3em',
          color:         '#C9A84C',
          margin:        0,
          lineHeight:    1,
        }}>
          ROADHOUSE
        </p>
        <p style={{
          fontSize:      '9px',
          letterSpacing: '0.4em',
          color:         'rgba(255,255,255,0.2)',
          margin:        '6px 0 0',
          textTransform: 'uppercase',
        }}>
          Capital
        </p>
      </div>

      {/* Card */}
      <div style={{
        width:      '100%',
        maxWidth:   '360px',
        border:     '0.5px solid rgba(255,255,255,0.08)',
        padding:    '2rem',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <p style={{
          fontSize:      '10px',
          letterSpacing: '0.2em',
          color:         'rgba(255,255,255,0.3)',
          textTransform: 'uppercase',
          margin:        '0 0 1.75rem',
        }}>
          Member access
        </p>

        {/* Error */}
        {error && (
          <div style={{
            border:       '0.5px solid rgba(231,76,60,0.3)',
            background:   'rgba(231,76,60,0.06)',
            padding:      '0.75rem 1rem',
            marginBottom: '1.25rem',
            fontSize:     '11px',
            color:        'rgba(231,76,60,0.8)',
            lineHeight:   1.6,
          }}>
            {error}
          </div>
        )}

        {unregistered ? (
          /* Wallet connected but not linked to a subscription */
          <>
            <div style={{
              border:       '0.5px solid rgba(201,168,76,0.2)',
              background:   'rgba(201,168,76,0.04)',
              padding:      '1rem',
              marginBottom: '1.25rem',
            }}>
              <p style={{
                fontFamily:    '"Space Mono", monospace',
                fontSize:      '10px',
                color:         'rgba(255,255,255,0.5)',
                margin:        '0 0 0.5rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}>
                Wallet not linked
              </p>
              <p style={{
                fontFamily: '"Space Mono", monospace',
                fontSize:   '11px',
                color:      'rgba(255,255,255,0.35)',
                margin:     0,
                lineHeight: 1.7,
              }}>
                This wallet isn&apos;t connected to a RoadHouse subscription yet.
              </p>
            </div>

            <a href="/portal" style={{
              display:       'block',
              width:         '100%',
              padding:       '1rem',
              background:    '#C9A84C',
              color:         '#000',
              fontFamily:    '"Space Mono", monospace',
              fontSize:      '11px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              textAlign:     'center',
              marginBottom:  '0.75rem',
              boxSizing:     'border-box',
            }}>
              Link via portal →
            </a>

            <a href="/#membership" style={{
              display:        'block',
              textAlign:      'center',
              fontSize:       '10px',
              color:          'rgba(255,255,255,0.25)',
              fontFamily:     '"Space Mono", monospace',
              letterSpacing:  '0.12em',
              textDecoration: 'none',
            }}>
              Or subscribe to get started →
            </a>

            <button
              onClick={() => { setUnregistered(false); disconnect(); }}
              style={{
                display:       'block',
                width:         '100%',
                marginTop:     '0.75rem',
                padding:       '0.5rem',
                background:    'none',
                border:        'none',
                color:         'rgba(255,255,255,0.2)',
                fontFamily:    '"Space Mono", monospace',
                fontSize:      '9px',
                letterSpacing: '0.1em',
                cursor:        'pointer',
              }}
            >
              ← Try a different wallet
            </button>
          </>
        ) : (
          /* Default: wallet connect button + portal link */
          <>
            <button
              onClick={() => { setError(null); setVisible(true); }}
              disabled={loading}
              style={{
                width:          '100%',
                padding:        '1rem',
                background:     '#C9A84C',
                border:         'none',
                color:          '#000',
                fontFamily:     '"Space Mono", monospace',
                fontSize:       '11px',
                letterSpacing:  '0.2em',
                textTransform:  'uppercase',
                cursor:         loading ? 'not-allowed' : 'pointer',
                opacity:        loading ? 0.6 : 1,
                marginBottom:   '0.75rem',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            '0.5rem',
                transition:     'opacity 0.15s',
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width:          '10px',
                    height:         '10px',
                    border:         '1.5px solid #000',
                    borderTopColor: 'transparent',
                    borderRadius:   '50%',
                    display:        'inline-block',
                    animation:      'spin 0.7s linear infinite',
                  }} />
                  Connecting…
                </>
              ) : (
                <>◎ Connect Wallet</>
              )}
            </button>

            <a
              href="/portal"
              style={{
                display:        'block',
                textAlign:      'center',
                fontSize:       '10px',
                color:          'rgba(255,255,255,0.2)',
                letterSpacing:  '0.12em',
                textDecoration: 'none',
                marginTop:      '1.5rem',
                transition:     'color 0.15s',
              }}
              onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.4)')}
              onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.2)')}
            >
              Email lookup only — view portal →
            </a>
          </>
        )}
      </div>

      {/* Bottom note */}
      <p style={{
        marginTop:     '2rem',
        fontSize:      '9px',
        color:         'rgba(255,255,255,0.12)',
        letterSpacing: '0.12em',
        textAlign:     'center',
      }}>
        No account? Select a membership tier on the landing page after connecting.
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Bottom rule */}
      <div style={{
        position:   'fixed',
        bottom:     0,
        left:       0,
        right:      0,
        height:     '1px',
        background: 'linear-gradient(90deg, transparent, #C9A84C20, transparent)',
      }} />
    </div>
  );
}
