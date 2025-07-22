import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function WelcomePage() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);  // NEW: loading state for user fetch
  const [input, setInput] = useState('');
  const [chat, setChat] = useState([
    { sender: 'bot', text: 'Hi! What song would you like recommendations for?' },
  ]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    fetch(`${process.env.REACT_APP_BACKEND_URL}/welcome`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Not logged in');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setUser(data);
          setLoadingUser(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadingUser(false);
          navigate('/login');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const handleLogout = async () => {
    await fetch(`${process.env.REACT_APP_BACKEND_URL}/logout`, { credentials: 'include' });
    navigate('/login');
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    setChat((prev) => [...prev, { sender: 'user', text: input }]);
    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ song: input }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to get recommendations');
      }

      const recommendations = await response.json();

      if (recommendations.length === 0) {
        setChat((prev) => [
          ...prev,
          { sender: 'bot', text: `Sorry, no recommendations found for "${input}".` },
        ]);
      } else {
        setChat((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: `Here are some recommendations based on "${input}":`,
            recommendations,
          },
        ]);
      }

      setInput('');
    } catch (err) {
      setErrorMsg(err.message);
      setChat((prev) => [
        ...prev,
        { sender: 'bot', text: `⚠️ ${err.message}` },
      ]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      sendMessage();
    }
  };

  if (loadingUser) {
    return (
      <div style={{ color: '#eee', textAlign: 'center', marginTop: '2rem' }}>
        Loading user...
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#121212',
        color: '#eee',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      }}
    >
      <div
        style={{
          padding: '1rem',
          backgroundColor: '#1db954',
          color: 'black',
          fontWeight: 'bold',
          fontSize: '1.25rem',
          textAlign: 'center',
          borderBottom: '1px solid #111',
          userSelect: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>Music ChatBot</div>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>Welcome, {user.message || user.display_name || 'User'}!</span>
            <button
              onClick={handleLogout}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                border: 'none',
                backgroundColor: '#b33939',
                color: '#eee',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          whiteSpace: 'pre-wrap',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        {chat.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: msg.sender === 'user' ? '#1db954' : '#333',
              color: msg.sender === 'user' ? 'black' : 'white',
              padding: '10px 15px',
              borderRadius: 20,
              maxWidth: '80%',
              boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
              fontSize: '1rem',
              whiteSpace: 'pre-wrap',
            }}
          >
            {msg.text}

            {msg.recommendations && (
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                {msg.recommendations.map((r, i) => (
                  <li key={i}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#1db954', textDecoration: 'underline' }}
                    >
                      {r.name} by {r.artist}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          display: 'flex',
          padding: '0.5rem 1rem',
          backgroundColor: '#222',
          borderTop: '1px solid #333',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder={loading ? 'Generating recommendations...' : 'Type a song name and hit Enter...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          style={{
            flex: 1,
            padding: '10px 15px',
            fontSize: '1rem',
            borderRadius: 20,
            border: 'none',
            outline: 'none',
            marginRight: '1rem',
            backgroundColor: '#121212',
            color: '#eee',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            padding: '10px 20px',
            borderRadius: 20,
            border: 'none',
            backgroundColor: '#1db954',
            color: 'black',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Thinking...' : 'Send'}
        </button>
      </div>

      {errorMsg && (
        <div
          style={{
            backgroundColor: '#b33939',
            color: '#eee',
            padding: '0.5rem 1rem',
            textAlign: 'center',
          }}
        >
          {errorMsg}
        </div>
      )}
    </div>
  );
}


