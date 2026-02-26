import "@testing-library/jest-dom/vitest";

// Polyfill ResizeObserver for jsdom (used by Radix UI / shadcn components)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
