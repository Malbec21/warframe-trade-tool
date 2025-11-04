import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignup?: () => void;
}

export function LoginForm({ onSuccess, onSwitchToSignup }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (error: string): string => {
    // Extract user-friendly message from API error
    if (error.includes('401') || error.includes('Incorrect')) {
      return 'Incorrect username or password';
    }
    if (error.includes('400')) {
      return 'Invalid login credentials';
    }
    if (error.includes('fetch')) {
      return 'Unable to connect to server. Please try again.';
    }
    return error;
  };

  return (
    <div className="w-full max-w-md p-8 bg-wf-dark-bg-lighter rounded-lg border border-wf-dark-border">
      <h2 className="text-2xl font-bold text-wf-dark-text mb-6 text-center">Login</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-wf-accent-red/20 border border-wf-accent-red rounded text-wf-accent-red text-sm">
          {getErrorMessage(error)}
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
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 bg-wf-dark-bg border border-wf-dark-border rounded text-wf-dark-text focus:outline-none focus:ring-2 focus:ring-wf-primary"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-wf-primary hover:bg-wf-primary-hover text-white font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {onSwitchToSignup && (
        <p className="mt-4 text-center text-sm text-wf-dark-text-dim">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToSignup}
            className="text-wf-primary hover:underline"
          >
            Sign up
          </button>
        </p>
      )}
    </div>
  );
}

