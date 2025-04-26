import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Validate email format
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Validate password (minimum 6 characters)
  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleLogin = async () => {
    setError(''); // Clear previous errors

    // Validate inputs
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        onLogin(); // Update login state
        navigate('/dashboard'); // Redirect to dashboard
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md transform transition-all hover:scale-[1.01]" style={{ 
        background: 'var(--card-bg)',
        boxShadow: 'var(--shadow-md)',
        transition: 'var(--transition)'
      }}>
        <h2 className="text-3xl font-bold text-center mb-8" style={{ 
          color: 'var(--primary)',
          fontFamily: 'var(--font-secondary)'
        }}>Welcome Back</h2>
        {error && (
          <div className="px-4 py-3 rounded-lg mb-4" style={{ 
            background: 'rgba(244, 67, 54, 0.1)',
            borderLeft: '4px solid var(--danger)',
            color: 'var(--danger)'
          }}>
            {error}
          </div>
        )}
        <div className="space-y-6">
          <div className="transform transition-all duration-300">
            <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-dark)' }}>
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              className="mt-1 block w-full px-4 py-3 rounded-lg"
              style={{
                border: '1px solid var(--border-light)',
                transition: 'var(--transition)',
                color: 'var(--text-dark)'
              }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="transform transition-all duration-300">
            <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-dark)' }}>
              Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              className="mt-1 block w-full px-4 py-3 rounded-lg"
              style={{
                border: '1px solid var(--border-light)',
                transition: 'var(--transition)',
                color: 'var(--text-dark)'
              }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            onClick={handleLogin}
            className="w-full py-3 px-4 rounded-lg font-medium"
            style={{
              background: 'var(--primary)',
              color: 'white',
              transition: 'var(--transition)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            Login
          </button>
        </div>
        <p className="mt-8 text-center text-sm" style={{ color: 'var(--text-light)' }}>
          Don't have an account?{' '}
          <a href="/register" style={{ 
            color: 'var(--primary)',
            fontWeight: '500',
            transition: 'var(--transition)'
          }}>
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;