import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Login.module.css';

export default function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.formTitle}>Войти</h1>
      
      {error && <div className={styles.errorMessage}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className={styles.inputField}
          />
        </div>

        <div className={styles.inputGroup}>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className={styles.inputField}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={styles.submitButton}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <p className={styles.footerText}>
        У вас нету аккаунта?{' '}
        <Link to="/register" className={styles.link}>
          Зарегестрироваться
        </Link>
      </p>
    </div>
  );
}