import { cn } from '@/shared/lib/utils.js'

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'w-full h-11 px-4 rounded-xl bg-surface-2 border border-border text-sm text-fg placeholder:text-faint',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus:border-transparent transition',
        className,
      )}
      {...props}
    />
  )
}
