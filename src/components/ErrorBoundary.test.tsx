import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../test/utils'
import { ErrorBoundaryClass } from './ErrorBoundary'
import React from 'react'

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>No error</div>
}

describe('ErrorBoundaryClass', () => {
  // Suppress console.error for these tests since we expect errors
  const originalError = console.error
  beforeAll(() => {
    console.error = vi.fn()
  })

  afterAll(() => {
    console.error = originalError
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundaryClass>
        <ThrowError shouldThrow={false} />
      </ErrorBoundaryClass>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundaryClass>
        <ThrowError />
      </ErrorBoundaryClass>
    )

    // Should show error title
    expect(screen.getByText('Component Error')).toBeInTheDocument()

    // Should show error message
    expect(screen.getByText('Test error message')).toBeInTheDocument()

    // Should have refresh button
    expect(screen.getByText('Refresh Page')).toBeInTheDocument()
  })

  it('displays error message correctly', () => {
    render(
      <ErrorBoundaryClass>
        <ThrowError />
      </ErrorBoundaryClass>
    )

    const errorMessage = screen.getByText('Test error message')
    expect(errorMessage).toBeInTheDocument()
  })

  it('has refresh button that reloads page', () => {
    // Mock window.location.reload
    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    })

    render(
      <ErrorBoundaryClass>
        <ThrowError />
      </ErrorBoundaryClass>
    )

    const refreshButton = screen.getByText('Refresh Page')
    refreshButton.click()

    expect(reloadMock).toHaveBeenCalled()
  })

  it('catches and displays different error messages', () => {
    const CustomError: React.FC = () => {
      throw new Error('Custom error message for testing')
    }

    render(
      <ErrorBoundaryClass>
        <CustomError />
      </ErrorBoundaryClass>
    )

    expect(screen.getByText('Custom error message for testing')).toBeInTheDocument()
  })
})
