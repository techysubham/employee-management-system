import React, { useState } from 'react';
import axios from 'axios';
import '../App.css';
import API_URL from '../config';

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/login`, formData);
      onLogin(response.data.user);
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (username, password) => {
    setFormData({ username, password });
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Employee Management System</h1>
        <h2>Login</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email / Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="demo-accounts">
          <h3>Demo Accounts</h3>
          <div className="demo-buttons">
            <button 
              className="demo-btn hr-btn"
              onClick={() => quickLogin('hr@company.com', 'hr123')}
            >
              HR Account
              <small>hr@company.com / hr123</small>
            </button>
            <button 
              className="demo-btn employee-btn"
              onClick={() => quickLogin('john@company.com', 'john123')}
            >
              Employee Account (John)
              <small>john@company.com / john123</small>
            </button>
            <button 
              className="demo-btn employee-btn"
              onClick={() => quickLogin('jane@company.com', 'jane123')}
            >
              Employee Account (Jane)
              <small>jane@company.com / jane123</small>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
