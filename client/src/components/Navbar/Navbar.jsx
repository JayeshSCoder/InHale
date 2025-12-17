import { useState } from 'react';
import SettingsModal from '../SettingsModal/SettingsModal';
import { API_BASE_URL } from '../../config';
import styles from './Navbar.module.css';

const Navbar = ({ user, onUpdateUser }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const userName = user?.displayName || user?.name || 'Guest';
  const userImg = user?.image || user?.photos?.[0]?.value || user?.picture || 'https://via.placeholder.com/40';

  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);
  const handleUpdateUser = (updatedUser) => {
    onUpdateUser?.(updatedUser);
  };

  const handleLogout = async (event) => {
    event.stopPropagation();
    setIsMenuOpen(false);
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      onUpdateUser?.(null);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      window.location.href = '/login';
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.logo}>BreatheEasy</div>
        {user ? (
          <div
            className={styles.profile}
            onClick={toggleMenu}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => event.key === 'Enter' && toggleMenu()}
          >
            {userImg ? (
              <img className={styles.avatar} src={userImg} alt={userName} />
            ) : (
              <div
                className={styles.avatar}
                style={{ display: 'grid', placeItems: 'center', background: 'rgba(148, 163, 184, 0.2)' }}
              >
                {userName?.[0]?.toUpperCase() ?? 'B'}
              </div>
            )}
            <span>{userName}</span>
            <div className={`${styles.dropdown} ${isMenuOpen ? styles.open : ''}`}>
              <button type="button" onClick={(event) => { event.stopPropagation(); openSettings(); }}>
                Settings
              </button>
              <button type="button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        ) : (
          <a
            href="/auth/google"
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.4)',
              color: '#fff',
              textDecoration: 'none',
            }}
          >
            Login
          </a>
        )}
      </nav>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        user={user}
        onUpdateUser={handleUpdateUser}
      />
    </>
  );
};

export default Navbar;
