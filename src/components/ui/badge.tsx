import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#F0B90B] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#F0B90B] text-[#0B0E11] hover:bg-[#F0B90B]/80",
        secondary:
          "border-transparent bg-[#2B3139] text-[#EAECEF] hover:bg-[#373B42]",
        destructive:
          "border-transparent bg-[#F6465D] text-white hover:bg-[#D63F53]",
        success:
          "border-transparent bg-[#0ECB81] text-[#0B0E11] hover:bg-[#0FB37E]",
        warning:
          "border-transparent bg-[#F78D4B] text-white hover:bg-[#E67F44]",
        info:
          "border-transparent bg-[#5096FF] text-white hover:bg-[#4785E6]",
        outline: "border-[#2B3139] text-[#EAECEF] bg-transparent hover:bg-[#2B3139]",
        binance: "border-transparent bg-gradient-to-r from-[#F0B90B] to-[#FCD535] text-[#0B0E11] hover:from-[#F0B90B]/80 hover:to-[#FCD535]/80",
        green: "border-[#0ECB81]/20 bg-[#0ECB81]/10 text-[#0ECB81] hover:bg-[#0ECB81]/20",
        red: "border-[#F6465D]/20 bg-[#F6465D]/10 text-[#F6465D] hover:bg-[#F6465D]/20",
        yellow: "border-[#F0B90B]/20 bg-[#F0B90B]/10 text-[#F0B90B] hover:bg-[#F0B90B]/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
