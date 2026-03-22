export default function SectionDivider() {
  return (
    <div className="flex items-center w-full py-2 px-8 lg:px-16">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gold/30" />
      <span className="mx-4 text-gold text-xs tracking-widest">✦</span>
      <div className="flex-1 h-px bg-gradient-to-r from-gold/30 to-transparent" />
    </div>
  )
}
