// Polyfills IndexedDB in jsdom so Dexie-backed repository tests can run
// without a real browser.
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'

// `test.globals: false` (deliberate — this project prefers explicit
// `import { describe, it, expect } from 'vitest'`) means Testing Library
// can't auto-detect a global `afterEach` to hook its DOM cleanup into.
// Wire it up once, here, so every test file that renders a component
// unmounts it afterwards instead of leaking multiple trees into the same
// jsdom document across test cases.
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})

// jsdom doesn't implement matchMedia — stub a "no matches, no-op listeners"
// version so components that query it (theme detection, the responsive
// breakpoint watcher) can run under test instead of crashing.
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

// jsdom doesn't implement ResizeObserver either — TabBar's scroll-track
// indicator uses one to re-measure when the strip is resized. A no-op stub
// is enough under test: nothing here asserts on live resize behaviour.
if (typeof window.ResizeObserver !== 'function') {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
