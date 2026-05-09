import "@testing-library/jest-dom/vitest";

// @ts-expect-error jsdom react test flag
(global as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
