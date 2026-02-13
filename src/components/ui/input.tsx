import * as React from "react"

import { cn } from "@/lib/utils"

export function Input({ className, ...props }: any) {
  return <input className={`bg-[#23262F] text-white placeholder-white border border-[#23262F] rounded-lg focus:border-[#F0B90B] focus:ring-2 focus:ring-[#F0B90B] px-4 py-2 ${className || ''}`} {...props} />;
}
