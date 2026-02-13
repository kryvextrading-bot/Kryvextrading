import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-primary-foreground hover:shadow-glow hover:scale-105",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-gradient-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-success text-success-foreground hover:bg-success/90",
        gradient: "bg-gradient-primary text-primary-foreground hover:shadow-elegant hover:scale-105 transition-all duration-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
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

export function Button({ className, variant = 'default', asChild = false, ...props }: ButtonProps) {
  const base = 'font-bold rounded-lg transition-all shadow focus:outline-none focus:ring-2 focus:ring-[#F0B90B]';
  let color = '';
  if (variant === 'default' || variant === 'primary') {
    color = 'bg-[#F0B90B] text-black hover:bg-[#FFD666]';
  } else if (variant === 'outline') {
    color = 'bg-transparent border border-[#F0B90B] text-[#F0B90B] hover:bg-[#23262F]';
  } else if (variant === 'secondary') {
    color = 'bg-[#23262F] text-white hover:bg-[#181A20]';
  } else if (variant === 'danger') {
    color = 'bg-[#F6465D] text-white hover:bg-[#ff7b8a]';
  }
  
  const Comp = asChild ? Slot : "button";
  
  return (
    <Comp 
      className={`${base} ${color} px-5 py-2 ${className || ''}`} 
      {...(asChild ? {} : { type: "button" })} 
      {...props} 
    />
  );
}

export { buttonVariants };
