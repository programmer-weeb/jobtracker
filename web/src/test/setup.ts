import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// @ts-expect-error jsdom react test flag
(global as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

Object.defineProperty(window, "scrollTo", {
  value: vi.fn(),
  writable: true
});
