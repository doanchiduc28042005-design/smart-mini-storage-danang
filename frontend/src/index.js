import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
import App from "@/App";

// Filter out external script errors (e.g., Zalo browser injection 'zaloJSV2')
const EXTERNAL_ERROR_PATTERNS = [
  /zaloJSV2/i,
  /zaloJS/i,
  /Can't find variable: zalo/i,
  /Can't find variable: __zalo/i,
  /webkit-masked-url/i,
  /ResizeObserver loop/i,
  /Non-Error promise rejection/i,
];

const isExternalError = (message) => {
  if (!message) return false;
  const msg = typeof message === 'string' ? message : (message?.message || String(message));
  return EXTERNAL_ERROR_PATTERNS.some((pattern) => pattern.test(msg));
};

// Suppress runtime errors from external scripts (Zalo, social browsers, etc.)
window.addEventListener('error', (event) => {
  if (isExternalError(event.message) || isExternalError(event.error)) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return false;
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  if (isExternalError(event.reason)) {
    event.preventDefault();
    return false;
  }
});

// Also patch console.error to avoid noise in error overlay from external scripts
const originalConsoleError = console.error;
console.error = (...args) => {
  const msg = args.map(a => typeof a === 'string' ? a : (a?.message || '')).join(' ');
  if (isExternalError(msg)) return;
  originalConsoleError.apply(console, args);
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
