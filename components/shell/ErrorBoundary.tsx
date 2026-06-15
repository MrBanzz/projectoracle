"use client";

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  label: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("[ErrorBoundary]", this.props.label, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section
          aria-label="Panel error"
          className="rounded-lg border border-dashed border-accent-rose/40 bg-surface-panel/40 p-6"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
            {this.props.label}
          </p>
          <p className="mt-2 font-mono text-xs text-accent-rose">
            Something went wrong.
          </p>
        </section>
      );
    }
    return this.props.children;
  }
}
