import { createElement, type ComponentProps, type ReactNode } from "react"

// Small local primitives composed from the existing CAC setup classes.
export function GameButton({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "text" | "choice" }) {
  return createElement("button", {
    type: "button",
    ...props,
    className: `${
      variant === "primary"
        ? "setup-continue"
        : variant === "text"
          ? "setup-edit"
          : "play-choice"
    } ${className}`,
  })
}
export function GameHeading({
  level = 2,
  children,
  ...props
}: {
  level?: 1 | 2 | 3
  children: ReactNode
} & ComponentProps<"h2">) {
  return createElement(`h${level}`, props, children)
}
export function GameInput(props: ComponentProps<"input">) {
  return createElement("input", props)
}
export function GameSelect(props: ComponentProps<"select">) {
  return createElement("select", props)
}
