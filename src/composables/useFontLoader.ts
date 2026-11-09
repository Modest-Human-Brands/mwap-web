const loaded = new Map<string, Promise<boolean>>()

/**
 * Loads a font family from Google Fonts into this page, once. Resolves false when the font cannot be
 * loaded (unknown family, offline, blocked), so the caller can fall back.
 */
export function loadFont(family: string): Promise<boolean> {
  const name = family.trim()
  const cached = loaded.get(name)
  if (cached) return cached
  const pending = new Promise<boolean>((resolve) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, '+')}&display=swap`
    link.onload = () => {
      document.fonts
        .load(`16px "${name}"`)
        .then((faces) => resolve(faces.length > 0))
        .catch(() => resolve(false))
    }
    link.onerror = () => {
      link.remove()
      resolve(false)
    }
    document.head.append(link)
  })
  loaded.set(name, pending)
  void pending.then((ok) => {
    if (!ok) loaded.delete(name)
  })
  return pending
}