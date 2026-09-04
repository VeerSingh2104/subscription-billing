import PageTransition from '@/app/components/page-transition'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PageTransition>{children}</PageTransition>
}