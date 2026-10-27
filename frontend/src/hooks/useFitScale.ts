import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'

export const MIN_FIT_SCALE = 0.7

const px = (value: string) => Number.parseFloat(value) || 0

// Shrinks one block uniformly (CSS `zoom`, like browser zoom-out) so a setup
// page fits the stage panel without changing its layout. The block must not
// have vertical margins; any siblings are treated as fixed height. Below `min`
// the scale stops and the panel scrolls rather than making text unreadable.
// Returns [callback ref for the block, style to put on it].
export function useFitScale<T extends HTMLElement = HTMLElement>(
  min = MIN_FIT_SCALE,
) {
  const [element, setElement] = useState<T | null>(null)
  const [scale, setScale] = useState(1)
  const attach = useCallback((node: T | null) => setElement(node), [])
  const frame = useRef(0)

  useLayoutEffect(() => {
    const parent = element?.parentElement
    if (!element || !parent || typeof ResizeObserver === 'undefined') return
    const panel = element.closest<HTMLElement>('.stage__panel')

    const fit = () => {
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(() => {
        // Bounding boxes are visual (post-zoom) pixels, matching the panel's.
        const own = element.getBoundingClientRect().height
        if (own === 0) return
        const panelStyle = panel ? getComputedStyle(panel) : null
        const available = panelStyle
          ? panel!.clientHeight -
            px(panelStyle.paddingTop) -
            px(panelStyle.paddingBottom)
          : window.innerHeight
        let fixed = 0
        for (const child of parent.children) {
          if (child === element || !(child instanceof HTMLElement)) continue
          const style = getComputedStyle(child)
          if (style.display === 'none' || style.position === 'absolute')
            continue
          fixed +=
            child.getBoundingClientRect().height +
            px(style.marginTop) +
            px(style.marginBottom)
        }
        const target = available - fixed
        if (target <= 0) return
        setScale((current) => {
          // The small bias keeps the result on the safe (not overflowing) side.
          const next = Math.min(
            1,
            Math.max(min, (current * target * 0.995) / own),
          )
          // Ignore tiny changes unless the block currently overflows.
          return own <= target && Math.abs(next - current) < 0.005
            ? current
            : next
        })
      })
    }

    const observer = new ResizeObserver(fit)
    observer.observe(element)
    if (panel) observer.observe(panel)
    fit()
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame.current)
    }
  }, [element, min])

  const style: CSSProperties = scale < 1 ? { zoom: scale } : {}
  return [attach, style] as const
}
