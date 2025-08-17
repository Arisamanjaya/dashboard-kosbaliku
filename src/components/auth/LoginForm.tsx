'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { testSupabaseConnection } from '@/lib/testConnection';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  
  const { signIn } = useAuth();
  const router = useRouter();

  // Test connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      const result = await testSupabaseConnection();
      if (result.success) {
        setConnectionStatus('✅ Database connected');
      } else {
        setConnectionStatus(`❌ Database error: ${result.error}`);
      }
    };
    
    checkConnection();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🚀 Starting login process...');
      const { data, error } = await signIn(email, password);
      
      if (error) {
        console.error('Login error:', error);
        setError(error.message);
        return;
      }

      console.log('✅ Login successful, redirecting...');
      // Redirect will be handled by AuthRedirect component
      router.push('/');
    } catch (err: any) {
      console.error('Login exception:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Login Dashboard Kosbaliku
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Masuk dengan akun Anda
          </p>
          
          {/* Connection Status */}
          <div className="mt-4 text-center">
            <p className="text-sm">{connectionStatus}</p>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
                placeholder="Masukkan email Anda"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
                placeholder="Masukkan password Anda"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
          
          {/* Demo accounts info */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Demo Accounts:</h3>
            <div className="mt-2 text-xs text-blue-600 dark:text-blue-300">
              <p><strong>Admin:</strong> user1@gmail.com / admin123</p>
              <p><strong>Pemilik:</strong> farhan.kos@gmail.com / password123</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;