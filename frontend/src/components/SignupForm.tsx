import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function SignupForm({ onSuccess, onSwitchToLogin }: SignupFormProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();

  // Live password validation
  const validatePasswords = (pass: string, confirmPass: string) => {
    if (confirmPass === '') {
      setPasswordError('');
      return;
    }
    if (pass !== confirmPass) {
      setPasswordError('Passwords do not match');
    } else {
      setPasswordError('');
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    validatePasswords(value, confirmPassword);
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    validatePasswords(password, value);
  };

  const getErrorMessage = (error: string): string => {
    // Extract user-friendly message from API error
    if (error.includes('already registered') || error.includes('already exists')) {
      return 'Username or email already exists';
    }
    if (error.includes('400')) {
      return 'Invalid signup information. Please check your details.';
    }
    if (error.includes('fetch') || error.includes('500')) {
      return 'Unable to connect to server. Please try again later.';
    }
    return error;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await signup(username, email, password);
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed. Please try again.';
      setError(getErrorMessage(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-wf-dark-bg-lighter rounded-lg border border-wf-dark-border">
      <h2 className="text-2xl font-bold text-wf-dark-text mb-6 text-center">Sign Up</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-wf-accent-red/20 border border-wf-accent-red rounded text-wf-accent-red text-sm">
          {getErrorMessage(error)}
        </div>
      )}

      {passwordError && !error && (
        <div className="mb-4 p-3 bg-wf-accent-gold/20 border border-wf-accent-gold rounded text-wf-accent-gold text-sm">
          {passwordError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-wf-dark-text-dim mb-1">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={50}
            className="w-full px-3 py-2 bg-wf-dark-bg border border-wf-dark-border rounded text-wf-dark-text focus:outline-none focus:ring-2 focus:ring-wf-primary"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-wf-dark-text-dim mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 bg-wf-dark-bg border border-wf-dark-border rounded text-wf-dark-text focus:outline-none focus:ring-2 focus:ring-wf-primary"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-wf-dark-text-dim mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            required
            minLength={8}
            maxLength={72}
            className="w-full px-3 py-2 bg-wf-dark-bg border border-wf-dark-border rounded text-wf-dark-text focus:outline-none focus:ring-2 focus:ring-wf-primary"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-wf-dark-text-dim">Must be 8-72 characters</p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-wf-dark-text-dim mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => handleConfirmPasswordChange(e.target.value)}
            required
            minLength={8}
            maxLength={72}
            className={`w-full px-3 py-2 bg-wf-dark-bg border rounded text-wf-dark-text focus:outline-none focus:ring-2 ${
              passwordError && confirmPassword !== '' 
                ? 'border-wf-accent-red focus:ring-wf-accent-red' 
                : 'border-wf-dark-border focus:ring-wf-primary'
            }`}
            disabled={isLoading}
          />
          {confirmPassword !== '' && !passwordError && password === confirmPassword && (
            <p className="mt-1 text-xs text-wf-accent-green">✓ Passwords match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !!passwordError}
          className="w-full py-2 px-4 bg-wf-primary hover:bg-wf-primary-hover text-white font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      {onSwitchToLogin && (
        <p className="mt-4 text-center text-sm text-wf-dark-text-dim">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-wf-primary hover:underline"
          >
            Login
          </button>
        </p>
      )}
    </div>
  );
}

