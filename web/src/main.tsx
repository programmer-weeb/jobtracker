import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { router } from "./app/router";
import { queryClient } from "./app/query-client";
import { AuthProvider, useAuth } from "./features/auth/context";
import { ErrorBoundary } from "./components/error-boundary";
import "./styles/global.css";

function AppRouter() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth: { hydrated: auth.hydrated, isAuthenticated: auth.isAuthenticated } }} />;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ErrorBoundary>
          <AppRouter />
        </ErrorBoundary>
      </AuthProvider>
      {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  </React.StrictMode>
);
