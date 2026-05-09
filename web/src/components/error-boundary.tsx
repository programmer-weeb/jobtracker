import React from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-[var(--background)] p-4">
          <Card className="max-w-md p-6 text-center">
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Something went wrong</h1>
            <p className="mt-2 text-[var(--muted-foreground)]">An unexpected error occurred. Please try reloading the page.</p>
            <Button
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Reload
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
