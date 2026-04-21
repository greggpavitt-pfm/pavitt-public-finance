"use client"
// src/lib/useReveal.ts
// Scroll-reveal helpers. Wrap IntersectionObserver so sections fade+rise
// into view once. Respects prefers-reduced-motion via globals.css.
//
// Usage (single element):
//   const ref = useReveal<HTMLDivElement>()
//   <div ref={ref} className="reveal-on-scroll">…</div>
//
// Usage (card grid — children must already have reveal-on-scroll + data-delay in JSX):
//   const ref = useRevealChildren<HTMLDivElement>()
//   <div ref={ref}>
//     <article className="reveal-on-scroll" data-delay="1">…</article>
//     <article className="reveal-on-scroll" data-delay="2">…</article>
//   </div>

import { useEffect, useRef } from "react"

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (el.classList.contains("is-visible")) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible")
            io.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -80px 0px" }
    )

    io.observe(el)
    return () => io.disconnect()
  }, [])

  return ref
}

/**
 * Variant for card grids. Children must have `reveal-on-scroll` and
 * `data-delay` applied in their JSX (not imperatively) to avoid the
 * visible→invisible→visible FOUC caused by adding the class after mount.
 * This hook only adds `.is-visible` to all children when the container
 * first enters the viewport.
 */
export function useRevealChildren<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const children = Array.from(el.children) as HTMLElement[]

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            children.forEach((c) => c.classList.add("is-visible"))
            io.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -80px 0px" }
    )

    io.observe(el)
    return () => io.disconnect()
  }, [])

  return ref
}
