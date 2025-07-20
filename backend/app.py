import os
from flask import Flask, request, redirect, session, jsonify, url_for
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', os.urandom(24))

CORS(app, supports_credentials=True, origins=[
    "http://localhost:3000",
    os.getenv('FRONTEND_URL')
])



app.config.update(
    SESSION_COOKIE_SAMESITE="None",
    SESSION_COOKIE_SECURE=True
)

CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')
SCOPE = "user-read-private user-read-email"
REDIRECT_URI = os.getenv('REDIRECT_URI')

sp_oauth = SpotifyOAuth(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    redirect_uri=REDIRECT_URI,
    scope=SCOPE,
    show_dialog=True,
    cache_path=".spotifycache"
)
@app.route('/')
def login():
    auth_url = sp_oauth.get_authorize_url()
    return redirect(auth_url)

@app.route('/callback')
def callback():
    code = request.args.get('code')
    if not code:
        return jsonify({'error': 'Authorization code missing'}), 400

    try:
        token_info = sp_oauth.get_access_token(code)
        session['token_info'] = token_info

        sp = spotipy.Spotify(auth=token_info['access_token'])
        user_info = sp.current_user()
        session['user_info'] = user_info

    except Exception as e:
        return jsonify({'error': 'Failed to get access token', 'details': str(e)}), 500

    return redirect(os.getenv('FRONTEND_URL') + '/welcome')



@app.route('/welcome')
def welcome_user():
    token_info = session.get('token_info')
    if not token_info:
        return redirect(url_for('login'))

    if sp_oauth.is_token_expired(token_info):
        token_info = sp_oauth.refresh_access_token(token_info['refresh_token'])
        session['token_info'] = token_info

    sp = spotipy.Spotify(auth=token_info['access_token'])
    user = sp.current_user()
    return jsonify({
        'message': f"Welcome {user['display_name']}!",
        'email': user.get('email'),
        'id': user['id']
    })

@app.route('/logout')
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/recommend', methods=['POST'])
def recommend():
    token_info = session.get('token_info')
    if not token_info:
        return redirect(url_for('login'))

    if sp_oauth.is_token_expired(token_info):
        token_info = sp_oauth.refresh_access_token(token_info['refresh_token'])
        session['token_info'] = token_info

    sp = spotipy.Spotify(auth=token_info['access_token'])

    data = request.get_json()
    if not data or 'song' not in data:
        return jsonify({'error': 'Missing song in request'}), 400

    song_name = data['song']
    results = sp.search(q=song_name, limit=1, type='track')
    if not results['tracks']['items']:
        return jsonify({'error': 'Song not found'}), 404

    track_id = results['tracks']['items'][0]['id']
    recs = sp.recommendations(seed_tracks=[track_id], limit=5, market="US")

    suggestions = [{
        'name': t['name'],
        'artist': t['artists'][0]['name'],
        'url': t['external_urls']['spotify']
    } for t in recs['tracks']]

    return jsonify(suggestions)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

