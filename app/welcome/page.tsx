'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

/* ─── Types ──────────────────────────────────────────────────────── */
interface SessionData {
  customerId: string;
  email: string | null;
  tier: string;
  tierLabel: string;
  roadBalance: number;
  walletLinked: boolean;
  portalEmail: string | null;
}

const TIER_ICON: Record<string, string> = {
  regular: '◎',
  'ranch-hand': '◇',
  partner: '◆',
  steward: '⬡',
  praetor: '★',
};

const TIER_ROAD: Record<string, number> = {
  regular: 100,
  'ranch-hand': 500,
  partner: 2000,
};

/* ─── Inner component (reads search params) ──────────────────────── */
function WelcomeContent() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get('session_id');
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [walletLoading, setWalletLoading] = useState(false);

  const [data, setData] = useState<SessionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (!sessionId) {
      // No session → redirect home rather than showing a broken page
      router.replace('/');
      return;
    }

    fetch(`/api/checkout/session?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
        setStep('ready');
      })
      .catch((e: Error) => {
        setError(e.message);
        setStep('error');
      })
      .finally(() => setLoading(false));
  }, [sessionId, router]);

  // Wallet connect on /welcome → establish session → go to dashboard
  useEffect(() => {
    if (!connected || !publicKey) return;
    setWalletLoading(true);
    fetch('/api/auth/wallet', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ publicKey: publicKey.toBase58() }),
    })
      .then(() => router.replace('/dashboard'))
      .catch(() => setWalletLoading(false));
  }, [connected, publicKey, router]);

  /* ── Loading ── */
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-6" />
          <p className="text-white/40 text-sm font-mono tracking-widest uppercase">
            Confirming membership…
          </p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (step === 'error' || !data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="text-white/30 font-mono text-xs tracking-widest uppercase mb-3">
            Something went wrong
          </p>
          <p className="text-white/60 text-sm mb-8">{error}</p>
          <Link
            href="/portal"
            className="border border-gold/30 text-gold/80 hover:text-gold hover:border-gold text-sm font-mono px-6 py-3 tracking-wider uppercase transition-colors"
          >
            Go to portal →
          </Link>
        </div>
      </div>
    );
  }

  const icon = TIER_ICON[data.tier] ?? '◎';
  const monthlyRoad = TIER_ROAD[data.tier] ?? 100;

  /* ── Success ── */
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Ambient gold line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-lg w-full">

          {/* Wordmark */}
          <p className="font-mono text-xs tracking-[0.3em] text-white/25 uppercase mb-16">
            RoadHouse Capital
          </p>

          {/* Tier confirmation */}
          <div className="mb-12">
            <div
              className="inline-flex items-center gap-3 border border-gold/20 bg-gold/5 px-5 py-3 mb-8"
              style={{ borderRadius: '2px' }}
            >
              <span className="text-gold text-xl">{icon}</span>
              <span className="font-mono text-xs tracking-[0.2em] text-gold uppercase">
                {data.tierLabel} — Active
              </span>
            </div>

            <h1 className="text-3xl font-light tracking-tight text-white mb-3">
              You're in.
            </h1>
            <p className="text-white/50 text-sm leading-relaxed">
              {data.email && (
                <>
                  Confirmation sent to{' '}
                  <span className="text-white/70">{data.email}</span>.{' '}
                </>
              )}
              Your $ROAD accrual starts this billing cycle.
            </p>
          </div>

          {/* Balance card */}
          <div
            className="border border-white/8 bg-white/3 p-6 mb-10"
            style={{ borderRadius: '4px' }}
          >
            <div className="flex items-baseline justify-between mb-4">
              <span className="font-mono text-xs tracking-widest text-white/30 uppercase">
                $ROAD Balance
              </span>
              <span className="font-mono text-xs text-white/25">
                +{monthlyRoad.toLocaleString()} / mo
              </span>
            </div>
            <div className="font-mono text-4xl text-white mb-1">
              {data.roadBalance.toLocaleString()}
            </div>
            <div className="h-px bg-white/8 my-4" />
            <p className="text-white/35 text-xs leading-relaxed">
              Contribution bonuses and bounties add to this balance. Connect a
              wallet to make it on-chain when the mainnet snapshot runs.
            </p>
          </div>

          {/* Discord status */}
          {!data.walletLinked && (
            <div
              className="border border-white/8 bg-white/2 px-5 py-4 mb-6 flex items-start gap-3"
              style={{ borderRadius: '4px' }}
            >
              <span className="text-white/25 mt-0.5">◈</span>
              <div>
                <p className="text-white/50 text-xs font-mono tracking-wider uppercase mb-1">
                  Discord role
                </p>
                <p className="text-white/35 text-xs leading-relaxed">
                  Run{' '}
                  <code className="text-white/55 bg-white/8 px-1 py-0.5 rounded text-xs">
                    /verify
                  </code>{' '}
                  in the RoadHouse Discord to link your role. Your tier is
                  confirmed — the role just needs your Discord ID.
                </p>
              </div>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col gap-3">
            {/* Primary: connect wallet → session → dashboard */}
            <button
              onClick={() => setVisible(true)}
              disabled={walletLoading}
              className="w-full text-center bg-gold text-black font-mono text-xs tracking-[0.2em] uppercase py-4 hover:bg-gold/90 transition-colors disabled:opacity-60"
              style={{ borderRadius: '2px' }}
            >
              {walletLoading ? 'Connecting…' : 'Connect Wallet — Unlock Dashboard →'}
            </button>

            {/* Secondary: portal (email-only, no wallet needed) */}
            <Link
              href={
                data.portalEmail
                  ? `/portal?email=${encodeURIComponent(data.portalEmail)}`
                  : '/portal'
              }
              className="w-full text-center border border-white/15 text-white/50 hover:text-white/80 hover:border-white/30 font-mono text-xs tracking-[0.15em] uppercase py-3.5 transition-colors"
              style={{ borderRadius: '2px' }}
            >
              Skip for now — view portal
            </Link>
          </div>

          {/* Footer hint */}
          <p className="text-center text-white/20 text-xs font-mono mt-10 tracking-widest">
            /{data.tier} · {new Date().toLocaleDateString('en-CA')}
          </p>
        </div>
      </main>
    </div>
  );
}

/* ─── Page export (wraps in Suspense — required for useSearchParams) */
export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="w-8 h-8 border border-gold/20 border-t-gold/60 rounded-full animate-spin" />
        </div>
      }
    >
      <WelcomeContent />
    </Suspense>
  );
}
