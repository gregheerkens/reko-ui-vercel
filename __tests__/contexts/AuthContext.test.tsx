import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../app/contexts/AuthContext'
import { api } from '../../app/lib/api'

// Mock the API client
jest.mock('../../app/lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    setToken: jest.fn(),
  },
}))

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

const TestComponent = () => {
  const { user, loading, isAuthenticated } = useAuth()
  
  return (
    <div>
      <span data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</span>
      {isAuthenticated ? (
        <div>User: {user?.displayName}</div>
      ) : (
        <div>Not authenticated</div>
      )}
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset localStorage mock
    const localStorageMock = {
      getItem: jest.fn().mockReturnValue(null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
  })

  describe('Initial State', () => {
    it('should show loading state initially', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading')
    })

    it('should show not authenticated when no token exists', async () => {
      ;(api.get as jest.Mock).mockRejectedValue(new Error('Not authenticated'))
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Not authenticated')).toBeInTheDocument()
      })
    })
  })

  describe('Login Flow', () => {
    it('should login user successfully', async () => {
      const mockUser = {
        _id: 'user-id',
        email: 'test@example.com',
        displayName: 'Test User',
        roles: [],
      }
      
      ;(api.post as jest.Mock).mockResolvedValue({ access_token: 'token' })
      ;(api.get as jest.Mock).mockResolvedValue(mockUser)
      
      const LoginTest = () => {
        const { login } = useAuth()
        React.useEffect(() => {
          login('test@example.com', 'password123')
        }, [login])
        return null
      }
      
      render(
        <AuthProvider>
          <LoginTest />
          <TestComponent />
        </AuthProvider>
      )
      
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/users/login', {
          email: 'test@example.com',
          password: 'password123',
        })
      })
    })

    it('should handle login failure', async () => {
      ;(api.post as jest.Mock).mockRejectedValue(new Error('Invalid credentials'))
      
      const LoginTest = () => {
        const { login } = useAuth()
        React.useEffect(() => {
          login('test@example.com', 'wrong').catch(() => {})
        }, [login])
        return null
      }
      
      render(
        <AuthProvider>
          <LoginTest />
          <TestComponent />
        </AuthProvider>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Not authenticated')).toBeInTheDocument()
      })
    })
  })

  describe('Logout Flow', () => {
    it('should logout user and clear token', async () => {
      const LogoutTest = () => {
        const { logout } = useAuth()
        React.useEffect(() => {
          logout()
        }, [logout])
        return <button onClick={logout}>Logout</button>
      }
      
      render(
        <AuthProvider>
          <LogoutTest />
        </AuthProvider>
      )
      
      await waitFor(() => {
        expect(api.setToken).toHaveBeenCalledWith(null)
      })
    })
  })

  describe('Register Flow', () => {
    it('should register user successfully', async () => {
      const mockUser = {
        _id: 'user-id',
        email: 'new@example.com',
        displayName: 'New User',
      }
      
      ;(api.post as jest.Mock).mockResolvedValue(mockUser)
      
      const RegisterTest = () => {
        const { register } = useAuth()
        React.useEffect(() => {
          register('new@example.com', 'password123', 'New User')
        }, [register])
        return null
      }
      
      render(
        <AuthProvider>
          <RegisterTest />
        </AuthProvider>
      )
      
      await waitFor(() => {
        expect(api.post).toHaveBeenCalled()
      })
    })
  })

  describe('Token Persistence', () => {
    it('should load user from token on mount', async () => {
      ;(localStorage.getItem as jest.Mock).mockReturnValue('test-token')
      const mockUser = {
        _id: 'user-id',
        email: 'test@example.com',
        displayName: 'Test User',
        roles: [],
      }
      ;(api.get as jest.Mock).mockResolvedValue(mockUser)
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      await waitFor(() => {
        expect(api.setToken).toHaveBeenCalledWith('test-token')
        expect(api.get).toHaveBeenCalledWith('/users/me')
      })
    })
  })
})

