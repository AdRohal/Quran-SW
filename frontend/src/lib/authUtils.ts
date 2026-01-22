// Authentication utility functions for client-side use

export const AuthUtils = {
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('authToken');
    return !!token;
  },

  // Get stored token
  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },

  // Set token
  setToken: (token: string): void => {
    localStorage.setItem('authToken', token);
  },

  // Remove token
  removeToken: (): void => {
    localStorage.removeItem('authToken');
  },

  // Clear all auth data
  clearAuth: (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  // Get stored user data
  getUser: (): any => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Set user data
  setUser: (user: any): void => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Validate email format
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate password strength
  isStrongPassword: (password: string): boolean => {
    // At least 6 characters, contains letter and number
    return password.length >= 6 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
  },

  // Get password strength indicator
  getPasswordStrength: (password: string): 'weak' | 'medium' | 'strong' => {
    if (password.length < 6) return 'weak';
    if (password.length < 10) return 'medium';
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'strong';
    return 'medium';
  },

  // Decode JWT token (without verification - for display only)
  decodeToken: (token: string): any => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  },

  // Check if token is expired
  isTokenExpired: (token: string): boolean => {
    const decoded = AuthUtils.decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    return decoded.exp * 1000 < Date.now();
  },
};

export default AuthUtils;
