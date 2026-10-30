import '@testing-library/jest-dom/vitest';

if (typeof window !== "undefined" && window.HTMLMediaElement) {
  window.HTMLMediaElement.prototype.load = () => {};
}
