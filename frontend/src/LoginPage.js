import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL}/welcome`, { credentials: 'include' })
      .then(res => {
        if (res.ok) {
          navigate('https://music-chatbot-dzl6.onrender.com/welcome');
        }
      })
      .catch(() => {});
  }, [navigate]);

  const handleLogin = () => {
    window.location.href = `${process.env.REACT_APP_BACKEND_URL}/`;
  };

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        backgroundColor: '#121212',
        color: '#eee',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
      }}
    >
      <h1>Music ChatBot</h1>
      <button
        onClick={handleLogin}
        style={{
          padding: '1rem 2rem',
          fontSize: '1.25rem',
          borderRadius: 20,
          border: 'none',
          backgroundColor: '#1db954',
          color: 'black',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        Login with Spotify
      </button>
      <p style={{ marginTop: 20, maxWidth: 300, textAlign: 'center' }}>
        After logging in, please return here and your session will be detected.
      </p>
    </div>
  );
}
