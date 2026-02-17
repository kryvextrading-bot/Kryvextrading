import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0B90B] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#F0B90B] text-[#0B0E11] hover:bg-[#F0B90B]/90 shadow-lg hover:shadow-xl hover:scale-[1.02]",
        destructive:
          "bg-[#F6465D] text-white hover:bg-[#D63F53] shadow-lg hover:shadow-xl",
        outline:
          "border border-[#2B3139] bg-[#1E2329] text-[#EAECEF] hover:bg-[#2B3139] hover:border-[#F0B90B]/50",
        secondary:
          "bg-[#2B3139] text-[#EAECEF] hover:bg-[#373B42] border border-[#2B3139]",
        ghost: "hover:bg-[#2B3139] hover:text-[#EAECEF] text-[#848E9C]",
        link: "text-[#F0B90B] underline-offset-4 hover:underline",
        success: "bg-[#0ECB81] text-[#0B0E11] hover:bg-[#0FB37E] shadow-lg hover:shadow-xl",
        warning: "bg-[#F78D4B] text-white hover:bg-[#E67F44] shadow-lg hover:shadow-xl",
        info: "bg-[#5096FF] text-white hover:bg-[#4785E6] shadow-lg hover:shadow-xl",
        binance: "bg-gradient-to-r from-[#F0B90B] to-[#FCD535] text-[#0B0E11] hover:from-[#F0B90B]/90 hover:to-[#FCD535]/90 shadow-lg hover:shadow-xl hover:scale-[1.02]",
        dark: "bg-[#1E2329] text-[#EAECEF] hover:bg-[#23262F] border border-[#2B3139]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-6 text-base",
        icon: "h-10 w-10",
        xl: "h-14 rounded-lg px-8 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
);

Button.displayName = "Button";

export { buttonVariants };
