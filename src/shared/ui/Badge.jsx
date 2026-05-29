import { cn } from '@/shared/lib/utils.js'

export function Badge({ className, variant = 'neutral', ...props }) {
  const styles = variant === 'accent'
    ? 'bg-accent/10 text-accent border-accent/20'
    : 'bg-surface-2 text-muted border-border'
  return (
    <span
      className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border', styles, className)}
      {...props}
    />
  )
}
