import type { ComponentProps } from 'react'
import { cn } from 'cn'

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea data-slot="textarea" className={cn('flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-[#d28a4c] focus-visible:ring-2 focus-visible:ring-[#d28a4c]/40 aria-invalid:border-[#e48356]', className)} {...props} />
}
