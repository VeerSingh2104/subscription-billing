type StatusBadgeProps = {
  status: string | null | undefined
}

const statusStyles: Record<string, string> = {
  ACTIVE:
    'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  DRAFT:
    'border-slate-400/30 bg-slate-500/10 text-slate-700 dark:text-slate-300',
  ISSUED:
    'border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  PAID:
    'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  VOID:
    'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const label = status || 'ACTIVE'
  const style =
    statusStyles[label] ??
    'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300'

  return (
    <span
      className={`motion-card inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-[10px] font-semibold transition-colors duration-200 ${style}`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  )
}