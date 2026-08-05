export const themeOptions = ['system', 'dark', 'light']

export function getStoredTheme() {
  try {
    const storedTheme = window.localStorage.getItem('portfolio-theme')
    return themeOptions.includes(storedTheme) ? storedTheme : 'system'
  } catch {
    return 'system'
  }
}

export function storeTheme(theme) {
  try {
    window.localStorage.setItem('portfolio-theme', theme)
  } catch {
    // Theme persistence is optional when browser storage is unavailable.
  }
}

export function applyTheme(theme, systemPrefersDark) {
  const resolvedTheme = theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : theme
  document.documentElement.dataset.theme = resolvedTheme
  document.documentElement.style.colorScheme = resolvedTheme
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', resolvedTheme === 'dark' ? '#080b10' : '#f4f7fb')
}
