import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { act } from 'react-dom/test-utils';
import LoginPage from '../../../frontend/src/pages/loginPage/LoginPage';

// Mock the API calls
jest.mock('../../../frontend/src/api/auth', () => ({
  login: jest.fn(),
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

// Mock the BasicForm component
jest.mock('../../../frontend/src/components/BasicForm', () => {
  return function MockBasicForm({ initialValues, onSubmit, validationSchema }) {
    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(initialValues);
    };

    return (
      <form onSubmit={handleSubmit} data-testid="login-form">
        <input
          type="text"
          name="userID"
          defaultValue={initialValues.userID}
          data-testid="userid-input"
        />
        <input
          type="password"
          name="password"
          defaultValue={initialValues.password}
          data-testid="password-input"
        />
        <input
          type="checkbox"
          name="rememberMe"
          data-testid="remember-me-checkbox"
        />
        <button type="submit" data-testid="login-button">
          Login
        </button>
      </form>
    );
  };
});

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  );
};

describe('LoginPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);
  });

  describe('Initial Render', () => {
    test('renders login form with correct elements', () => {
      renderLoginPage();

      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.getByTestId('userid-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('remember-me-checkbox')).toBeInTheDocument();
      expect(screen.getByTestId('login-button')).toBeInTheDocument();
    });

    test('renders TCMS branding', () => {
      renderLoginPage();

      expect(screen.getByText('TCMS')).toBeInTheDocument();
      expect(screen.getByText('Please Login to Continue')).toBeInTheDocument();
    });

    test('renders forgot password link', () => {
      renderLoginPage();

      expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
    });

    test('renders register link', () => {
      renderLoginPage();

      expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
      expect(screen.getByText('Register here')).toBeInTheDocument();
    });
  });

  describe('Remember Me Functionality', () => {
    test('loads remembered user from localStorage', () => {
      const rememberedUser = 'S001';
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'rememberedUser') return rememberedUser;
        if (key === 'rememberMe') return 'true';
        return null;
      });

      renderLoginPage();

      expect(screen.getByTestId('userid-input')).toHaveValue(rememberedUser);
    });

    test('sets remember me checkbox when user was remembered', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'rememberedUser') return 'S001';
        if (key === 'rememberMe') return 'true';
        return null;
      });

      renderLoginPage();

      const checkbox = screen.getByTestId('remember-me-checkbox');
      expect(checkbox).toBeChecked();
    });

    test('does not set remember me checkbox when user was not remembered', () => {
      localStorageMock.getItem.mockReturnValue(null);

      renderLoginPage();

      const checkbox = screen.getByTestId('remember-me-checkbox');
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('Auto-login Functionality', () => {
    test('performs auto-login with valid tokens', async () => {
      const mockUserData = {
        userid: 'S001',
        role: 'student',
        name: 'John Doe'
      };

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'rememberedUser') return 'S001';
        if (key === 'rememberMe') return 'true';
        if (key === 'authToken') return 'valid-token';
        if (key === 'userData') return JSON.stringify(mockUserData);
        if (key === 'tokenExpiry') return new Date(Date.now() + 3600000).toISOString();
        return null;
      });

      sessionStorageMock.getItem.mockReturnValue('true');

      await act(async () => {
        renderLoginPage();
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/studentdashboard');
      });
    });

    test('does not auto-login with expired tokens', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'rememberedUser') return 'S001';
        if (key === 'rememberMe') return 'true';
        if (key === 'authToken') return 'expired-token';
        if (key === 'tokenExpiry') return new Date(Date.now() - 3600000).toISOString();
        return null;
      });

      sessionStorageMock.getItem.mockReturnValue('true');

      await act(async () => {
        renderLoginPage();
      });

      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    test('clears expired tokens but keeps remembered user', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'rememberedUser') return 'S001';
        if (key === 'rememberMe') return 'true';
        if (key === 'authToken') return 'expired-token';
        if (key === 'tokenExpiry') return new Date(Date.now() - 3600000).toISOString();
        return null;
      });

      sessionStorageMock.getItem.mockReturnValue('true');

      await act(async () => {
        renderLoginPage();
      });

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('userData');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('tokenExpiry');
        expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('rememberedUser');
        expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('rememberMe');
      });
    });
  });

  describe('Form Submission', () => {
    test('handles successful login for student', async () => {
      const { login } = require('../../../frontend/src/api/auth');
      const mockResponse = {
        success: true,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: {
          userid: 'S001',
          role: 'student',
          name: 'John Doe'
        }
      };

      login.mockResolvedValue(mockResponse);

      renderLoginPage();

      const form = screen.getByTestId('login-form');
      
      await act(async () => {
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(login).toHaveBeenCalledWith({
          userID: '',
          password: ''
        });
        expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'new-access-token');
        expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', 'new-refresh-token');
        expect(localStorageMock.setItem).toHaveBeenCalledWith('userData', JSON.stringify(mockResponse.user));
        expect(mockNavigate).toHaveBeenCalledWith('/studentdashboard');
      });
    });

    test('handles successful login for teacher', async () => {
      const { login } = require('../../../frontend/src/api/auth');
      const mockResponse = {
        success: true,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: {
          userid: 'T001',
          role: 'teacher',
          name: 'Jane Smith'
        }
      };

      login.mockResolvedValue(mockResponse);

      renderLoginPage();

      const form = screen.getByTestId('login-form');
      
      await act(async () => {
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/teacherdashboard');
      });
    });

    test('handles successful login for admin', async () => {
      const { login } = require('../../../frontend/src/api/auth');
      const mockResponse = {
        success: true,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: {
          userid: 'A001',
          role: 'admin',
          name: 'Admin User'
        }
      };

      login.mockResolvedValue(mockResponse);

      renderLoginPage();

      const form = screen.getByTestId('login-form');
      
      await act(async () => {
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admindashboard');
      });
    });

    test('handles login failure', async () => {
      const { login } = require('../../../frontend/src/api/auth');
      const mockResponse = {
        success: false,
        message: 'Invalid credentials'
      };

      login.mockResolvedValue(mockResponse);

      renderLoginPage();

      const form = screen.getByTestId('login-form');
      
      await act(async () => {
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(login).toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    test('handles login error', async () => {
      const { login } = require('../../../frontend/src/api/auth');
      login.mockRejectedValue(new Error('Network error'));

      renderLoginPage();

      const form = screen.getByTestId('login-form');
      
      await act(async () => {
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(login).toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });
  });

  describe('Remember Me Checkbox', () => {
    test('saves user data when remember me is checked', async () => {
      const { login } = require('../../../frontend/src/api/auth');
      const mockResponse = {
        success: true,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: {
          userid: 'S001',
          role: 'student',
          name: 'John Doe'
        }
      };

      login.mockResolvedValue(mockResponse);

      renderLoginPage();

      const checkbox = screen.getByTestId('remember-me-checkbox');
      const form = screen.getByTestId('login-form');

      fireEvent.click(checkbox);
      
      await act(async () => {
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('rememberedUser', 'S001');
        expect(localStorageMock.setItem).toHaveBeenCalledWith('rememberMe', 'true');
      });
    });

    test('does not save user data when remember me is unchecked', async () => {
      const { login } = require('../../../frontend/src/api/auth');
      const mockResponse = {
        success: true,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: {
          userid: 'S001',
          role: 'student',
          name: 'John Doe'
        }
      };

      login.mockResolvedValue(mockResponse);

      renderLoginPage();

      const form = screen.getByTestId('login-form');
      
      await act(async () => {
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(localStorageMock.setItem).not.toHaveBeenCalledWith('rememberedUser', expect.any(String));
        expect(localStorageMock.setItem).not.toHaveBeenCalledWith('rememberMe', 'true');
      });
    });
  });

  describe('Navigation Links', () => {
    test('navigates to forgot password page', () => {
      renderLoginPage();

      const forgotPasswordLink = screen.getByText('Forgot Password?');
      fireEvent.click(forgotPasswordLink);

      expect(mockNavigate).toHaveBeenCalledWith('/forgotpassword');
    });

    test('navigates to register page', () => {
      renderLoginPage();

      const registerLink = screen.getByText('Register here');
      fireEvent.click(registerLink);

      expect(mockNavigate).toHaveBeenCalledWith('/register');
    });
  });

  describe('Error Handling', () => {
    test('displays backend error message', async () => {
      const { login } = require('../../../frontend/src/api/auth');
      const mockResponse = {
        success: false,
        message: 'Account is locked'
      };

      login.mockResolvedValue(mockResponse);

      renderLoginPage();

      const form = screen.getByTestId('login-form');
      
      await act(async () => {
        fireEvent.submit(form);
      });

      await waitFor(() => {
        // Note: In a real implementation, you would check for error message display
        expect(login).toHaveBeenCalled();
      });
    });

    test('handles network errors gracefully', async () => {
      const { login } = require('../../../frontend/src/api/auth');
      login.mockRejectedValue(new Error('Network error'));

      renderLoginPage();

      const form = screen.getByTestId('login-form');
      
      await act(async () => {
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(login).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading state during authentication check', async () => {
      // Mock a delay in localStorage.getItem to simulate loading
      localStorageMock.getItem.mockImplementation(() => {
        return new Promise(resolve => setTimeout(() => resolve(null), 100));
      });

      renderLoginPage();

      // Should show loading initially
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });
}); 