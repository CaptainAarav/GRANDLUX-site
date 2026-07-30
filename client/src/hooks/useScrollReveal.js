import { useEffect, useRef } from 'react'

export function useScrollReveal(options = {}) {
  const { threshold = 0.1 } = options
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0

    if (isVisible) {
      el.classList.add('visible')
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible')
          observer.unobserve(el)
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return ref
}
