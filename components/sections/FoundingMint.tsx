'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Loader2, Shield, Star, Check, ExternalLink, AlertTriangle } from 'lucide-react'
import { ConnectButton } from '@/components/wallet'
import { siteConfig } from '@/lib/site-config'
import { NETWORK } from '@/lib/solana'

// ── Mint config ───────────────────────────────────────────────────────────────
const MINT_CONFIG = {
  supply:        500,
  priceSOL:      0.5,         // 0.5 SOL per Founding NFT
  priceDisplay:  '0.5 SOL',
  priceCAD:      '~$75 CAD',  // approximate at launch
  maxPerWallet:  1,           // soul-bound concept — one per wallet
  revenueShare: {
    treasury:   0.70,
    operations: 0.20,
    founder:    0.10,
  },
}

const FOUNDING_BENEFITS = [
  { icon: '★', text: 'Steward-tier access for 12 months' },
  { icon: '◆', text: '1,000 $ROAD airdrop at mainnet launch' },
  { icon: '⬡', text: 'VIP access to first three RoadHouse events' },
  { icon: '◇', text: 'Exclusive Founding Member Discord role' },
  { icon: '⚜', text: 'Name in permanent founding member register' },
  { icon: '→', text: 'Soul-bound: non-transferable for 12 months' },
]

// ── Mint states ───────────────────────────────────────────────────────────────
type MintState = 'idle' | 'confirming' | 'minting' | 'success' | 'error'

export default function FoundingMint() {
  const { publicKey, connected, sendTransaction } = useWallet()
  const { connection } = useConnection()

  const [mintState, setMintState] = useState<MintState>('idle')
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const nftCollectionAddress = siteConfig.solana.nft.founding
  const nftReady = Boolean(nftCollectionAddress)

  // ── Mint handler ─────────────────────────────────────────────────────────────
  // NOTE: This is the devnet test flow — transfers SOL to treasury as payment placeholder.
  // Replace with Candy Machine v3 `mintV2` instruction when collection is deployed.
  const handleMint = async () => {
    if (!publicKey || !connected) return

    setMintState('confirming')
    setErrorMsg(null)

    try {
      // Validate treasury wallet is configured
      const treasuryAddress = siteConfig.solana.treasuryWallet
      if (!treasuryAddress) {
        throw new Error('Treasury wallet not configured. Set NEXT_PUBLIC_TREASURY_WALLET in .env.local.')
      }

      // Check wallet SOL balance
      const balance = await connection.getBalance(publicKey)
      const requiredLamports = MINT_CONFIG.priceSOL * LAMPORTS_PER_SOL + 10_000 // + fee buffer
      if (balance < requiredLamports) {
        throw new Error(
          `Insufficient SOL. Need ${MINT_CONFIG.priceSOL} SOL + fees. ` +
          `Your balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`
        )
      }

      setMintState('minting')

      // ── Devnet placeholder: SOL transfer to treasury ──────────────────────
      // In production, replace this block with Candy Machine v3 mintV2 CPI call
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(treasuryAddress),
          lamports: MINT_CONFIG.priceSOL * LAMPORTS_PER_SOL,
        })
      )

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      tx.recentBlockhash = blockhash
      tx.feePayer = publicKey

      const signature = await sendTransaction(tx, connection)

      // Confirm transaction
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed')

      setTxSignature(signature)
      setMintState('success')

    } catch (err: any) {
      console.error('[FoundingMint] error:', err)
      const message = err?.message ?? 'Mint failed. Please try again.'
      // User rejected — don't show error UI
      if (message.includes('User rejected') || message.includes('user rejected')) {
        setMintState('idle')
        return
      }
      setErrorMsg(message)
      setMintState('error')
    }
  }

  const explorerUrl = txSignature
    ? `https://explorer.solana.com/tx/${txSignature}${NETWORK === 'devnet' ? '?cluster=devnet' : ''}`
    : null

  const reset = () => {
    setMintState('idle')
    setErrorMsg(null)
    setTxSignature(null)
  }

  return (
    <section id="mint" className="px-8 lg:px-16 py-20 border-t border-rh-border">

      {/* Header */}
      <div className="mb-10">
        <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">
          Limited · 500 Total · Soul-Bound 12 Months
        </div>
        <h2 className="text-4xl lg:text-5xl font-light italic" style={{ fontFamily: 'var(--font-cormorant)' }}>
          Founding <span className="text-gold">Membership NFT</span>
        </h2>
        <p className="text-rh-muted text-sm mt-3 max-w-xl tracking-wide leading-relaxed">
          The inaugural RoadHouse on-chain credential. 500 minted. Each one is a permanent record
          of being here at the beginning — Steward access, $ROAD allocation, and a name in the register.
        </p>
        <div className="gold-line mt-4 max-w-xs" />
      </div>

      {/* Network badge */}
      {NETWORK === 'devnet' && (
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded border border-yellow-600/30 bg-yellow-600/5 text-[10px] text-yellow-500 tracking-wider uppercase">
          <AlertTriangle size={11} />
          Devnet — Test transactions only. No real SOL required.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl">

        {/* Benefits card */}
        <div className="p-6 bg-rh-card border border-rh-border rounded-lg">
          <div className="text-[9px] tracking-[0.3em] uppercase text-rh-faint mb-5">What You Get</div>

          <div className="space-y-3 mb-6">
            {FOUNDING_BENEFITS.map(b => (
              <div key={b.text} className="flex items-start gap-3">
                <span className="text-gold mt-0.5 w-4 text-center shrink-0">{b.icon}</span>
                <span className="text-[12px] text-rh-muted leading-relaxed">{b.text}</span>
              </div>
            ))}
          </div>

          <div className="gold-line mb-4" />

          {/* Revenue allocation */}
          <div className="text-[9px] tracking-[0.3em] uppercase text-rh-faint mb-3">Mint Revenue Allocation</div>
          <div className="space-y-1.5">
            {[
              { label: 'Community Treasury', pct: 70, color: 'bg-gold' },
              { label: 'Operations',         pct: 20, color: 'bg-gold-dark' },
              { label: 'Founder Draw',       pct: 10, color: 'bg-gold-muted' },
            ].map(r => (
              <div key={r.label} className="flex items-center gap-3">
                <div className="w-20 text-[10px] text-rh-faint">{r.pct}%</div>
                <div className="flex-1 h-1 bg-rh-border rounded-full overflow-hidden">
                  <div className={`h-full ${r.color} rounded-full`} style={{ width: `${r.pct}%` }} />
                </div>
                <div className="text-[10px] text-rh-muted w-28 text-right">{r.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mint card */}
        <div className="p-6 bg-rh-card border border-rh-border rounded-lg flex flex-col">
          <div className="text-[9px] tracking-[0.3em] uppercase text-rh-faint mb-4">Mint a Founding NFT</div>

          {/* Price */}
          <div className="flex items-end gap-3 mb-6">
            <div className="text-5xl font-light text-gold" style={{ fontFamily: 'var(--font-cormorant)' }}>
              {MINT_CONFIG.priceDisplay}
            </div>
            <div className="mb-1.5 text-[11px] text-rh-faint">{MINT_CONFIG.priceCAD}</div>
          </div>

          {/* Supply */}
          <div className="flex items-center justify-between mb-6 p-3 bg-rh-elevated rounded border border-rh-border">
            <div className="text-[10px] text-rh-faint">Total Supply</div>
            <div className="text-[12px] text-rh-text font-medium">{MINT_CONFIG.supply} NFTs</div>
          </div>

          {/* NFT not deployed yet */}
          {!nftReady && mintState === 'idle' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6 text-center">
              <Shield size={28} className="text-rh-faint" />
              <div className="text-[12px] text-rh-muted">
                Founding NFT mint opens soon.
              </div>
              <div className="text-[10px] text-rh-faint">
                500 total · 0.5 SOL · Soul-bound 12 months
              </div>
              <a
                href="#membership"
                onClick={e => { e.preventDefault(); document.getElementById('membership')?.scrollIntoView({ behavior: 'smooth' }) }}
                className="mt-2 px-4 py-2 text-[10px] tracking-widest uppercase border border-rh-border text-rh-muted hover:border-gold/40 hover:text-gold rounded transition-colors"
              >
                Subscribe via Stripe in the meantime →
              </a>
            </div>
          )}

          {/* Mint flow — idle */}
          {nftReady && mintState === 'idle' && (
            <div className="flex-1 flex flex-col justify-between">
              {!connected ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="text-[12px] text-rh-muted mb-2">Connect your Phantom wallet to mint</div>
                  <ConnectButton />
                </div>
              ) : (
                <>
                  <div className="text-[11px] text-rh-faint mb-6 leading-relaxed">
                    Your wallet: <span className="text-rh-text font-mono">
                      {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-6)}
                    </span>
                    <br />
                    Ensure you have at least <span className="text-gold">{MINT_CONFIG.priceSOL + 0.01} SOL</span> for mint + fees.
                  </div>
                  <button
                    onClick={handleMint}
                    className="w-full py-3.5 stripe-btn text-rh-black text-[11px] tracking-widest uppercase font-medium rounded transition-all hover:opacity-90"
                  >
                    Mint Founding NFT — {MINT_CONFIG.priceDisplay}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Confirming */}
          {mintState === 'confirming' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6">
              <Loader2 size={28} className="animate-spin text-gold" />
              <div className="text-[12px] text-rh-muted">Waiting for wallet approval...</div>
              <div className="text-[10px] text-rh-faint">Approve the transaction in Phantom</div>
            </div>
          )}

          {/* Minting */}
          {mintState === 'minting' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6">
              <Loader2 size={28} className="animate-spin text-gold" />
              <div className="text-[12px] text-rh-muted">Minting on-chain...</div>
              <div className="text-[10px] text-rh-faint">Confirming on Solana {NETWORK}</div>
            </div>
          )}

          {/* Success */}
          {mintState === 'success' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-6 text-center">
              <div className="w-14 h-14 rounded-full border border-gold/40 bg-gold/10 flex items-center justify-center">
                <Check size={24} className="text-gold" />
              </div>
              <div>
                <div className="text-xl font-light italic text-gold mb-1" style={{ fontFamily: 'var(--font-cormorant)' }}>
                  Welcome to the RoadHouse.
                </div>
                <div className="text-[11px] text-rh-muted">Founding NFT minted successfully.</div>
              </div>
              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[10px] text-gold hover:underline"
                >
                  <ExternalLink size={10} />
                  View transaction on Explorer
                </a>
              )}
              <a
                href="https://discord.gg/wwhhKcnQJ3"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-[10px] tracking-widest uppercase border border-[#5865F2]/40 text-[#7289DA] hover:bg-[#5865F2]/10 rounded transition-colors"
              >
                Join the Founding Members Discord →
              </a>
            </div>
          )}

          {/* Error */}
          {mintState === 'error' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-6 text-center">
              <AlertTriangle size={24} className="text-red-400" />
              <div className="text-[12px] text-rh-muted max-w-xs leading-relaxed">{errorMsg}</div>
              <button
                onClick={reset}
                className="px-4 py-2 text-[10px] tracking-widest uppercase border border-rh-border text-rh-muted hover:border-gold/40 hover:text-gold rounded transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="mt-6 text-[11px] text-rh-faint tracking-wider max-w-2xl leading-relaxed">
        Founding NFTs are soul-bound (non-transferable) for 12 months post-mint to preserve community integrity.
        Standard tier NFTs are freely transferable. 5% royalty on secondary sales accrues to the community treasury.
      </p>
    </section>
  )
}
