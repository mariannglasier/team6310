import { createContext } from "react"

export type NavigationItem = "Learn" | "Donate"

export const NavigationContext = createContext<{
  activePage: NavigationItem | null
  navigate: (item: NavigationItem) => void
} | null>(null)
