import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-[#2B3139] bg-[#1E2329] px-4 py-3 text-sm text-[#EAECEF] placeholder-[#5E6673] transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#EAECEF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0B90B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0E11] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
