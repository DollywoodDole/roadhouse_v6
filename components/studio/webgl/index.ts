import dynamic from 'next/dynamic'

export const StudioWebGLDynamic = dynamic(
  () => import('./StudioWebGL'),
  { ssr: false, loading: () => null }
)
