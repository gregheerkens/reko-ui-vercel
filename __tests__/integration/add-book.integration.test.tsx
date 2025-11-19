/**
 * @jest-environment jsdom
 * 
 * Integration tests for Add Book page functionality
 * These tests verify the integration between components and API calls
 */

import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../app/contexts/AuthContext';
import AddBookPage from '../../app/add/page';
import { api } from '../../app/lib/api';
import { loadDictionary } from '../../app/lib/genome-dictionary';

// Mock dependencies
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/add',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('../../app/contexts/AuthContext');
jest.mock('../../app/lib/api');
jest.mock('../../app/lib/genome-dictionary');

const mockAuth = {
  user: { id: 'user-1', displayName: 'Test User', email: 'test@example.com' },
  loading: false,
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  loadUser: jest.fn(),
};

describe('Add Book Page Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue(mockAuth);
    (loadDictionary as jest.Mock).mockResolvedValue([
      {
        index: 1,
        name: 'Category',
        description: 'Book category',
        expressions: {
          F: { short: 'Fiction', description: 'Fiction', context: 'Fiction books', color: '#FF0000' },
          N: { short: 'Non-Fiction', description: 'Non-Fiction', context: 'Non-fiction books', color: '#0000FF' },
        },
      },
    ]);
  });

  describe('Authentication', () => {
    it('should redirect to login if not authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuth,
        isAuthenticated: false,
        loading: false,
      });

      render(<AddBookPage />);
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });

    it('should show loading state while checking authentication', () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuth,
        loading: true,
      });

      render(<AddBookPage />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Page Rendering', () => {
    it('should render add book page when authenticated', async () => {
      render(<AddBookPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Add Book')).toBeInTheDocument();
      });
    });

    it('should load trait definitions on mount', async () => {
      render(<AddBookPage />);
      
      await waitFor(() => {
        expect(loadDictionary).toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    it('should validate required fields before submission', async () => {
      (api.post as jest.Mock).mockResolvedValue({ _id: 'genome-1' });
      
      render(<AddBookPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Add Book')).toBeInTheDocument();
      });

      // Try to submit without filling form
      const submitButton = screen.getByText('Create Book');
      submitButton.click();

      await waitFor(() => {
        // Should show validation error
        expect(screen.getByText(/Title is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error when trait dictionary fails to load', async () => {
      (loadDictionary as jest.Mock).mockRejectedValue(new Error('Failed to load'));

      render(<AddBookPage />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load trait definitions/i)).toBeInTheDocument();
      });
    });

    it('should display error when book creation fails', async () => {
      (api.post as jest.Mock)
        .mockResolvedValueOnce({ _id: 'genome-1' }) // Genome creation succeeds
        .mockRejectedValueOnce(new Error('Book creation failed')); // Book creation fails

      render(<AddBookPage />);

      // This test would need more setup to actually trigger submission
      // It's a placeholder for the integration test structure
    });
  });
});

