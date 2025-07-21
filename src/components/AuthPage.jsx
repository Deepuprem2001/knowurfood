import React, { useState } from 'react';
import {
  loginUser,
  registerUser,
  setCurrentUser,
  USER_STORE
} from '../services/dbService';
import '../App.css'; // Optional styling

function AuthPage({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // or 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'register') {
        const user = await registerUser({ username, password });
        await setCurrentUser(user);
        onLoginSuccess(user);
      } else {
        const user = await loginUser({ username, password });
        await setCurrentUser(user);
        onLoginSuccess(user);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>

        <form onSubmit={handleSubmit}>
          <input
            className="form-control mb-2"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            className="form-control mb-2"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="btn btn-primary w-100 mb-2" type="submit">
            {mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>

        <p className="text-white text-center">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <span
            style={{ textDecoration: 'underline', cursor: 'pointer', color: '#00f' }}
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Register' : 'Login'}
          </span>
        </p>

        {error && <p className="text-danger text-center">{error}</p>}
      </div>
    </div>
  );
}

export default AuthPage;
