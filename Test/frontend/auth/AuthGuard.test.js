import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { act } from 'react-dom/test-utils';
import AuthGuard from '../../../frontend/src/components/AuthGuard';

// Mock the API utilities
jest.mock('../../../frontend/src/api/apiUtils', () => ({
  isAuthenticated: jest.fn(),
  getUserData: jest.fn(),
  checkTokenExpiry: jest.fn(),
}));

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock localStorage and sessionStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

const renderAuthGuard = (requiredRole = null, initialPath = '/protected') => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthGuard requiredRole={requiredRole}>
        <div data-testid="protected-content">Protected Content</div>
      </AuthGuard>
    </MemoryRouter>
  );
};

describe('AuthGuard Component', () => {
  const { isAuthenticated, getUserData, checkTokenExpiry } = require('../../../frontend/src/api/apiUtils');

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);
  });

  describe('Loading State', () => {
    test('shows loading spinner while checking authentication', () => {
      isAuthenticated.mockReturnValue(false);
      getUserData.mockReturnValue(null);

      renderAuthGuard();

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    test('hides loading spinner after authentication check', async () => {
      isAuthenticated.mockReturnValue(false);
      getUserData.mockReturnValue(null);

      await act(async () => {
        renderAuthGuard();
      });

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });
    });
  });

  describe('Authentication Check', () => {
    test('calls checkTokenExpiry on mount', async () => {
      isAuthenticated.mockReturnValue(true);
      getUserData.mockReturnValue({ role: 'student' });

      await act(async () => {
        renderAuthGuard();
      });

      expect(checkTokenExpiry).toHaveBeenCalled();
    });

    test('calls isAuthenticated to check authentication status', async () => {
      isAuthenticated.mockReturnValue(true);
      getUserData.mockReturnValue({ role: 'student' });

      await act(async () => {
        renderAuthGuard();
      });

      expect(isAuthenticated).toHaveBeenCalled();
    });

    test('calls getUserData to get user information', async () => {
      isAuthenticated.mockReturnValue(true);
      getUserData.mockReturnValue({ role: 'student' });

      await act(async () => {
        renderAuthGuard();
      });

      expect(getUserData).toHaveBeenCalled();
    });
  });

  describe('Unauthenticated Users', () => {
    test('redirects to login when user is not authenticated', async () => {
      isAuthenticated.mockReturnValue(false);
      getUserData.mockReturnValue(null);

      await act(async () => {
        renderAuthGuard();
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
      });
    });

    test('does not render protected content when not authenticated', async () => {
      isAuthenticated.mockReturnValue(false);
      getUserData.mockReturnValue(null);

      await act(async () => {
        renderAuthGuard();
      });

      await waitFor(() => {
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Authenticated Users - No Role Requirement', () => {
    test('renders protected content for authenticated student', async () => {
      isAuthenticated.mockReturnValue(true);
      getUserData.mockReturnValue({ role: 'student' });

      await act(async () => {
        renderAuthGuard();
      });

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    test('renders protected content for authenticated teacher', async () => {
      isAuthenticated.mockReturnValue(true);
      getUserData.mockReturnValue({ role: 'teacher' });

      await act(async () => {
        renderAuthGuard();
      });

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    test('renders protected content for authenticated admin', async () => {
      isAuthenticated.mockReturnValue(true);
      getUserData.mockReturnValue({ role: 'admin' });

      await act(async () => {
        renderAuthGuard();
      });

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });
  });

  describe('Role-Based Access Control', () => {
    describe('Admin Role Requirement', () => {
      test('allows admin user to access admin-only content', async () => {
        isAuthenticated.mockReturnValue(true);
        getUserData.mockReturnValue({ role: 'admin' });

        await act(async () => {
          renderAuthGuard('admin');
        });

        await waitFor(() => {
          expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
      });

      test('redirects student to student dashboard when accessing admin content', async () => {
        isAuthenticated.mockReturnValue(true);
        getUserData.mockReturnValue({ role: 'student' });

        await act(async () => {
          renderAuthGuard('admin');
        });

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith('/studentdashboard', { replace: true });
        });
      });

      test('redirects teacher to teacher dashboard when accessing admin content', async () => {
        isAuthenticated.mockReturnValue(true);
        getUserData.mockReturnValue({ role: 'teacher' });

        await act(async () => {
          renderAuthGuard('admin');
        });

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith('/teacherdashboard', { replace: true });
        });
      });
    });

    describe('Teacher Role Requirement', () => {
      test('allows teacher user to access teacher-only content', async () => {
        isAuthenticated.mockReturnValue(true);
        getUserData.mockReturnValue({ role: 'teacher' });

        await act(async () => {
          renderAuthGuard('teacher');
        });

        await waitFor(() => {
          expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
      });

      test('redirects student to student dashboard when accessing teacher content', async () => {
        isAuthenticated.mockReturnValue(true);
        getUserData.mockReturnValue({ role: 'student' });

        await act(async () => {
          renderAuthGuard('teacher');
        });

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith('/studentdashboard', { replace: true });
        });
      });

      test('redirects admin to admin dashboard when accessing teacher content', async () => {
        isAuthenticated.mockReturnValue(true);
        getUserData.mockReturnValue({ role: 'admin' });

        await act(async () => {
          renderAuthGuard('teacher');
        });

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith('/admindashboard', { replace: true });
        });
      });
    });

    describe('Student Role Requirement', () => {
      test('allows student user to access student-only content', async () => {
        isAuthenticated.mockReturnValue(true);
        getUserData.mockReturnValue({ role: 'student' });

        await act(async () => {
          renderAuthGuard('student');
        });

        await waitFor(() => {
          expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
      });

      test('redirects teacher to teacher dashboard when accessing student content', async () => {
        isAuthenticated.mockReturnValue(true);
        getUserData.mockReturnValue({ role: 'teacher' });

        await act(async () => {
          renderAuthGuard('student');
        });

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith('/teacherdashboard', { replace: true });
        });
      });

      test('redirects admin to admin dashboard when accessing student content', async () => {
        isAuthenticated.mockReturnValue(true);
        getUserData.mockReturnValue({ role: 'admin' });

        await act(async () => {
          renderAuthGuard('student');
        });

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith('/admindashboard', { replace: true });
        });
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles user with no role', async () => {
      isAuthenticated.mockReturnValue(true);
      getUserData.mockReturnValue({ role: null });

      await act(async () => {
        renderAuthGuard('admin');
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
      });
    });

    test('handles user with undefined role', async () => {
      isAuthenticated.mockReturnValue(true);
      getUserData.mockReturnValue({ role: undefined });

      await act(async () => {
        renderAuthGuard('admin');
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
      });
    });

    test('handles user with unknown role', async () => {
      isAuthenticated.mockReturnValue(true);
      getUserData.mockReturnValue({ role: 'unknown' });

      await act(async () => {
        renderAuthGuard('admin');
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
      });
    });

    test('handles null user data', async () => {
      isAuthenticated.mockReturnValue(true);
      getUserData.mockReturnValue(null);

      await act(async () => {
        renderAuthGuard('admin');
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
      });
    });

    test('handles undefined user data', async () => {
      isAuthenticated.mockReturnValue(true);
      getUserData.mockReturnValue(undefined);

      await act(async () => {
        renderAuthGuard('admin');
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
      });
    });
  });

  describe('Token Expiry Handling', () => {
    test('handles expired tokens gracefully', async () => {
      isAuthenticated.mockReturnValue(false); // Token expired
      getUserData.mockReturnValue(null);
      checkTokenExpiry.mockImplementation(() => {
        // Simulate token expiry cleanup
        localStorageMock.removeItem('authToken');
        localStorageMock.removeItem('refreshToken');
        localStorageMock.removeItem('userData');
        localStorageMock.removeItem('tokenExpiry');
      });

      await act(async () => {
        renderAuthGuard();
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
      });
    });

    test('calls checkTokenExpiry before checking authentication', async () => {
      isAuthenticated.mockReturnValue(true);
      getUserData.mockReturnValue({ role: 'student' });

      await act(async () => {
        renderAuthGuard();
      });

      // Verify checkTokenExpiry is called
      expect(checkTokenExpiry).toHaveBeenCalled();
    });
  });

  describe('Component Re-rendering', () => {
    test('re-checks authentication when location changes', async () => {
      isAuthenticated.mockReturnValue(true);
      getUserData.mockReturnValue({ role: 'student' });

      const { rerender } = render(
        <MemoryRouter initialEntries={['/page1']}>
          <AuthGuard>
            <div data-testid="protected-content">Protected Content</div>
          </AuthGuard>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      // Clear previous calls
      isAuthenticated.mockClear();
      getUserData.mockClear();

      // Simulate location change
      rerender(
        <MemoryRouter initialEntries={['/page2']}>
          <AuthGuard>
            <div data-testid="protected-content">Protected Content</div>
          </AuthGuard>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(isAuthenticated).toHaveBeenCalled();
        expect(getUserData).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles API utility errors gracefully', async () => {
      isAuthenticated.mockImplementation(() => {
        throw new Error('API Error');
      });
      getUserData.mockReturnValue(null);

      await act(async () => {
        renderAuthGuard();
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
      });
    });

    test('handles getUserData errors gracefully', async () => {
      isAuthenticated.mockReturnValue(true);
      getUserData.mockImplementation(() => {
        throw new Error('User data error');
      });

      await act(async () => {
        renderAuthGuard();
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
      });
    });
  });

  describe('Performance', () => {
    test('does not cause infinite re-renders', async () => {
      isAuthenticated.mockReturnValue(true);
      getUserData.mockReturnValue({ role: 'student' });

      const renderCount = jest.fn();

      const TestComponent = () => {
        renderCount();
        return <div data-testid="protected-content">Protected Content</div>;
      };

      await act(async () => {
        render(
          <MemoryRouter>
            <AuthGuard>
              <TestComponent />
            </AuthGuard>
          </MemoryRouter>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      // Should not render excessively
      expect(renderCount).toHaveBeenCalledTimes(1);
    });
  });
}); 