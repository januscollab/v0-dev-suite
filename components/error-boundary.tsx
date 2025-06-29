"use client"

import React from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="text-[#F44336] mb-4">
              <AlertTriangle size={48} className="mx-auto" />
            </div>
            <h2 className="text-xl font-bold text-[#1C1C1C] mb-2">Something went wrong</h2>
            <p className="text-[13px] text-[#6B6B6B] mb-6">
              The application encountered an unexpected error. Your data is safe and automatically backed up.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#FC8019] text-white text-[13px] font-medium rounded-lg hover:bg-[#E6722E] transition-all"
              >
                <RefreshCw size={16} />
                Reload Application
              </button>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="w-full px-4 py-2 bg-transparent border border-[#E0E0E0] text-[#3E3E3E] text-[13px] font-medium rounded-lg hover:border-[#FC8019] hover:text-[#FC8019] transition-all"
              >
                Try Again
              </button>
            </div>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-[11px] text-[#8E8E8E] cursor-pointer">Error Details</summary>
                <pre className="text-[10px] text-[#F44336] bg-[#FFF5F5] p-2 rounded mt-2 overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
