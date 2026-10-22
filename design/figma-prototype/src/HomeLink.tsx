import { createContext, createElement, useContext, type ComponentProps } from "react"

// Group screens override this action with their existing guarded exit.
export const HomeNavigationContext = createContext<(() => void) | null>(null)

export default function HomeLink({
  onClick,
  ...props
}: ComponentProps<"a">) {
  const onHome = useContext(HomeNavigationContext)
  return createElement("a", {
    ...props,
    href: "#main-content",
    "aria-label": "Community Assistance Center home",
    onClick: (event) => {
      onClick?.(event)
      if (event.defaultPrevented || !onHome) return
      event.preventDefault()
      onHome()
    },
  })
}
