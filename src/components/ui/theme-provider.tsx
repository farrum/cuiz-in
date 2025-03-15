
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Define the ThemeProviderProps interface directly instead of importing it
interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: string
  storageKey?: string
  enableSystem?: boolean
  [key: string]: any
}

export function ThemeProvider({ 
  children, 
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props 
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      defaultTheme={defaultTheme}
      enableSystem
      storageKey={storageKey}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
