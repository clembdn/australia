import { cn } from '@/shared/lib/utils.js'

export function Card({ className, interactive = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface',
        interactive && 'transition hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lift',
        className,
      )}
      {...props}
    />
  )
}
