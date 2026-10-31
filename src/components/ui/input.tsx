import type { ComponentProps } from 'react'
import { cn } from 'cn'

// Native input props (including ref) keep form validation and label associations intact.
export function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return <input type={type} data-slot="input" className={cn('flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base outline-none transition-colors placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-[#d28a4c] focus-visible:ring-2 focus-visible:ring-[#d28a4c]/40 aria-invalid:border-[#e48356]', className)} {...props} />
}
