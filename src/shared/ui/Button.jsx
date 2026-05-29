import { cva } from 'class-variance-authority'
import { cn } from '@/shared/lib/utils.js'

const button = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        accent: 'bg-accent text-accent-fg hover:opacity-90',
        secondary: 'bg-surface-2 text-fg border border-border hover:border-border-strong',
        ghost: 'text-muted hover:text-fg hover:bg-surface-2',
        outline: 'border border-border text-fg hover:bg-surface-2',
      },
      size: { sm: 'h-9 px-3 text-sm', md: 'h-11 px-4 text-sm', lg: 'h-12 px-5 text-base' },
    },
    defaultVariants: { variant: 'accent', size: 'md' },
  },
)

export function Button({ className, variant, size, ...props }) {
  return <button className={cn(button({ variant, size }), className)} {...props} />
}
