
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Define the ThemeProviderProps interface directly instead of importing it
interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: string
  storageKey?: string
  enableSystem?: boolean
  attribute?: string
  [key: string]: any
}

export function ThemeProvider({ 
  children, 
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  enableSystem = true,
  attribute = "class",
  ...props 
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute={attribute as any}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      storageKey={storageKey}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
