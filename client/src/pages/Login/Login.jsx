import { motion } from 'framer-motion';
import { API_BASE_URL } from '../../config';
import styles from './Login.module.css';

const Login = () => {
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <div className={styles.container}>
      <motion.div
        className={styles.orb}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      <motion.div
        className={styles.card}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <h1 className={styles.title}>InHale</h1>
        <p className={styles.subtitle}>Monitor the invisible killer.</p>
        <button type="button" className={styles.googleButton} onClick={handleGoogleLogin}>
          <span>Continue with Google</span>
        </button>
      </motion.div>
    </div>
  );
};

export default Login;
