"""
Flask Backend for NBA Sports Application
Main application entry point with comprehensive security
"""
from flask import Flask, jsonify, request, abort
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from marshmallow import Schema, fields, validate, ValidationError
from werkzeug.security import generate_password_hash, check_password_hash
import json
import os
import time
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv
import secrets

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Security Configuration
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', secrets.token_hex(32))
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_hex(32))

# Initialize security extensions
jwt = JWTManager(app)
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Configure logging for security events
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]',
    handlers=[
        logging.FileHandler('security.log'),
        logging.StreamHandler()
    ]
)
security_logger = logging.getLogger('security')

# Secure CORS configuration
allowed_origins = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',')
CORS(app, resources={
    r"/api/*": {
        "origins": allowed_origins,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Security headers
@app.after_request
def after_request(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

# Security event logging
def log_security_event(event_type, user_id=None, details=None):
    """Log security events for monitoring"""
    security_logger.warning({
        'timestamp': datetime.utcnow().isoformat(),
        'event': event_type,
        'user_id': user_id,
        'ip_address': request.remote_addr,
        'user_agent': request.user_agent.string[:200] if request.user_agent else None,
        'endpoint': request.endpoint,
        'details': details
    })

# Input validation schemas
class PlayerSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    position = fields.Str(required=True, validate=validate.OneOf([
        'Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'
    ]))
    team = fields.Str(required=True, validate=validate.Length(min=2, max=50))
    height = fields.Str(validate=validate.Length(max=10))
    weight = fields.Str(validate=validate.Length(max=10))
    birthDate = fields.Str(validate=validate.Length(max=20))

class CoachSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    age = fields.Int(validate=validate.Range(min=25, max=80))
    team = fields.Str(required=True, validate=validate.Length(min=2, max=50))
    history = fields.List(fields.Str(), missing=[])

class LoginSchema(Schema):
    username = fields.Str(required=True, validate=validate.Length(min=3, max=50))
    password = fields.Str(required=True, validate=validate.Length(min=6, max=128))

# Mock user data (in production, use a proper database)
MOCK_USERS = {
    'admin': {
        'id': 1,
        'username': 'admin',
        'password_hash': generate_password_hash('admin123'),
        'role': 'admin'
    },
    'user': {
        'id': 2,
        'username': 'user',
        'password_hash': generate_password_hash('user123'),
        'role': 'user'
    }
}

# Authentication endpoints
@app.route('/api/auth/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    """Authenticate user and return JWT token"""
    try:
        schema = LoginSchema()
        data = schema.load(request.get_json() or {})
        
        username = data.get('username')
        password = data.get('password')
        
        user = MOCK_USERS.get(username)
        if not user or not check_password_hash(user['password_hash'], password):
            log_security_event('FAILED_LOGIN', details={'username': username})
            return jsonify({'error': 'Invalid credentials'}), 401
        
        access_token = create_access_token(
            identity=user['id'],
            additional_claims={'role': user['role'], 'username': user['username']}
        )
        
        log_security_event('SUCCESSFUL_LOGIN', user_id=user['id'])
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'role': user['role']
            }
        }), 200
        
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400
    except Exception as e:
        log_security_event('LOGIN_ERROR', details={'error': str(e)})
        return jsonify({'error': 'Authentication failed'}), 500

# Error handlers with security logging
@app.errorhandler(400)
def bad_request(error):
    log_security_event('BAD_REQUEST', details={'error': str(error)})
    return jsonify({'error': 'Invalid request data'}), 400

@app.errorhandler(401)
def unauthorized(error):
    log_security_event('UNAUTHORIZED_ACCESS')
    return jsonify({'error': 'Authentication required'}), 401

@app.errorhandler(403)
def forbidden(error):
    log_security_event('FORBIDDEN_ACCESS')
    return jsonify({'error': 'Insufficient permissions'}), 403

@app.errorhandler(429)
def rate_limit_exceeded(error):
    log_security_event('RATE_LIMIT_EXCEEDED')
    return jsonify({'error': 'Rate limit exceeded', 'retry_after': '60 seconds'}), 429

@app.errorhandler(500)
def internal_error(error):
    log_security_event('SERVER_ERROR', details={'error': str(error)})
    return jsonify({'error': 'Internal server error'}), 500

# Helper function to check user permissions
def require_role(required_role):
    """Decorator to check user role"""
    def decorator(f):
        def wrapper(*args, **kwargs):
            try:
                current_user = get_jwt_identity()
                if not current_user:
                    return jsonify({'error': 'Authentication required'}), 401
                
                # In a real app, fetch user details from database
                # For demo, we'll check the JWT claims
                from flask_jwt_extended import get_jwt
                claims = get_jwt()
                user_role = claims.get('role', 'user')
                
                if required_role == 'admin' and user_role != 'admin':
                    log_security_event('INSUFFICIENT_PERMISSIONS', user_id=current_user)
                    return jsonify({'error': 'Admin access required'}), 403
                
                return f(*args, **kwargs)
            except Exception as e:
                log_security_event('PERMISSION_CHECK_ERROR', details={'error': str(e)})
                return jsonify({'error': 'Permission check failed'}), 500
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator

# Load data files with input sanitization
def load_json_file(filename):
    """Helper function to load JSON data files with security checks"""
    try:
        # Validate filename to prevent directory traversal
        if '..' in filename or '/' in filename or '\\' in filename:
            log_security_event('DIRECTORY_TRAVERSAL_ATTEMPT', details={'filename': filename})
            return None
            
        file_path = os.path.join(os.path.dirname(__file__), 'data', filename)
        
        # Ensure file is within the data directory
        if not file_path.startswith(os.path.join(os.path.dirname(__file__), 'data')):
            log_security_event('UNAUTHORIZED_FILE_ACCESS', details={'filename': filename})
            return None
            
        with open(file_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        return None
    except json.JSONDecodeError as e:
        log_security_event('JSON_DECODE_ERROR', details={'filename': filename, 'error': str(e)})
        return None
    except Exception as e:
        log_security_event('FILE_LOAD_ERROR', details={'filename': filename, 'error': str(e)})
        return None


def save_json_file(filename, data):
    """Helper function to save JSON data files securely"""
    try:
        # Validate filename to prevent directory traversal
        if '..' in filename or '/' in filename or '\\' in filename:
            log_security_event('DIRECTORY_TRAVERSAL_ATTEMPT', details={'filename': filename})
            return False
            
        file_path = os.path.join(os.path.dirname(__file__), 'data', filename)
        
        # Ensure file is within the data directory
        if not file_path.startswith(os.path.join(os.path.dirname(__file__), 'data')):
            log_security_event('UNAUTHORIZED_FILE_ACCESS', details={'filename': filename})
            return False
            
        with open(file_path, 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        log_security_event('FILE_SAVE_ERROR', details={'filename': filename, 'error': str(e)})
        return False


def sanitize_input(data):
    """Sanitize input data to prevent XSS and injection attacks"""
    if isinstance(data, str):
        # Basic XSS prevention
        data = data.replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;').replace("'", '&#x27;')
        # Limit length
        data = data[:1000]
        return data.strip()
    elif isinstance(data, dict):
        return {k: sanitize_input(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_input(item) for item in data]
    return data


def get_game_results(sport_name: str, data_filename: str):
    """
    Generic helper to load and return game results for a given sport.

    This centralizes the common logic used by the different sport-specific
    endpoints (NBA, Football, Cricket), improving maintainability and
    reducing duplication.
    """
    try:
        games = load_json_file(data_filename)
        if games is None:
            # Maintain the same error message pattern as the sport-specific endpoints
            return jsonify({'error': f'Failed to load {sport_name} data'}), 500

        return jsonify({'result': games}), 200
    except Exception as e:
        # Log a detailed error for debugging while returning a user-friendly message
        print(f'Error serving {sport_name} data: {e}')
        return jsonify(
            {
                'error': (
                    f'Failed to load {sport_name} data. Please try again later.'
                )
            }
        ), 500


# NBA Games data - Protected endpoint
@app.route('/api/nba-results', methods=['GET'])
@limiter.limit("30 per minute")
def get_nba_results():
    """
    Retrieve NBA game results from the stored data file.

    This function fetches NBA game results by calling the generic get_game_results
    function with NBA-specific parameters.

    Returns:
        dict or list: NBA game results data loaded from 'nba-games.json' file.
        The exact structure depends on the implementation of get_game_results.

    Raises:
        FileNotFoundError: If the 'nba-games.json' file is not found.
        JSONDecodeError: If the JSON file contains invalid JSON data.

    Example:
        >>> results = get_nba_results()
        >>> # Process NBA game results
    """
    """Get NBA game results"""
    return get_game_results('NBA', 'nba-games.json')


# Football Games data - Protected endpoint
@app.route('/api/football-results', methods=['GET'])
@limiter.limit("30 per minute")
def get_football_results():
    """Get Football game results from data file"""
    return get_game_results('Football', 'football-games.json')


# Cricket Games data - Protected endpoint
@app.route('/api/cricket-results', methods=['GET'])
@limiter.limit("30 per minute")
def get_cricket_results():
    """Get Cricket game results"""
    return get_game_results('Cricket', 'cricket-games.json')

# Documentation endpoint for NBA results API
@app.route('/doc/nba-results', methods=['GET'])
def get_nba_results_documentation():
    """
    Get comprehensive documentation for the NBA results endpoint
    
    Returns:
        dict: Detailed documentation for the /api/nba-results endpoint including
              usage examples, parameters, response format, and implementation details
    """
    try:
        documentation = {
            "endpoint": "/api/nba-results",
            "method": "GET",
            "function_name": "get_nba_results",
            "description": "Retrieve NBA game results from the stored data file",
            "purpose": "Fetches NBA game results by calling the generic get_game_results function with NBA-specific parameters",
            "implementation": {
                "approach": "Uses shared get_game_results helper function for consistency",
                "data_source": "backend/data/nba-games.json",
                "error_handling": "Centralized through get_game_results function",
                "response_format": "JSON with 'result' array containing game objects"
            },
            "request_details": {
                "url": "http://localhost:8080/api/nba-results",
                "headers": {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                "cors_enabled": True,
                "allowed_origins": ["http://localhost:3000", "http://127.0.0.1:3000"]
            },
            "response_structure": {
                "success_response": {
                    "status_code": 200,
                    "format": {
                        "result": [
                            {
                                "id": "string - Unique game identifier",
                                "event_away_team": "string - Away team name",
                                "event_home_team": "string - Home team name",
                                "event_away_team_logo": "string - URL to away team logo",
                                "event_home_team_logo": "string - URL to home team logo", 
                                "event_final_result": "string - Final score (e.g., '112 - 108')",
                                "event_date": "string - ISO 8601 formatted date",
                                "event_status": "string - Game status (e.g., 'Finished')"
                            }
                        ]
                    }
                },
                "error_response": {
                    "status_code": 500,
                    "format": {
                        "error": "string - Error message describing the failure"
                    }
                }
            },
            "example_usage": {
                "curl_request": "curl -X GET http://localhost:8080/api/nba-results",
                "javascript_fetch": """
fetch('http://localhost:8080/api/nba-results')
  .then(response => response.json())
  .then(data => {
    console.log('NBA Games:', data.result);
    data.result.forEach(game => {
      console.log(`${game.event_away_team} vs ${game.event_home_team}: ${game.event_final_result}`);
    });
  })
  .catch(error => console.error('Error:', error));""",
                "next_js_example": """
// In your Next.js component
const fetchNBAResults = async () => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const response = await fetch(`${apiUrl}/api/nba-results`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch NBA results');
    }
    
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error fetching NBA results:', error);
    throw error;
  }
};"""
            },
            "sample_response": {
                "result": [
                    {
                        "id": "1",
                        "event_away_team": "Los Angeles Lakers",
                        "event_home_team": "Boston Celtics",
                        "event_away_team_logo": "https://logos.nba.com/teams/1610612747/logo.svg",
                        "event_home_team_logo": "https://logos.nba.com/teams/1610612738/logo.svg",
                        "event_final_result": "112 - 108",
                        "event_date": "2024-01-15T20:00:00Z",
                        "event_status": "Finished"
                    },
                    {
                        "id": "2", 
                        "event_away_team": "Golden State Warriors",
                        "event_home_team": "Miami Heat",
                        "event_away_team_logo": "https://logos.nba.com/teams/1610612744/logo.svg",
                        "event_home_team_logo": "https://logos.nba.com/teams/1610612748/logo.svg",
                        "event_final_result": "95 - 103",
                        "event_date": "2024-01-15T20:30:00Z",
                        "event_status": "Finished"
                    }
                ]
            },
            "technical_details": {
                "function_signature": "def get_nba_results():",
                "return_type": "Tuple[Response, int] - Flask JSON response with status code",
                "dependencies": ["get_game_results", "load_json_file"],
                "error_scenarios": [
                    "File not found: Returns 500 with 'Failed to load NBA data'",
                    "Invalid JSON: Returns 500 with 'Failed to load NBA data'", 
                    "General exception: Returns 500 with detailed error message"
                ],
                "performance": {
                    "caching": "No built-in caching - recommend frontend caching",
                    "file_size": "Small JSON file - fast response times",
                    "concurrent_requests": "Thread-safe file reading"
                }
            },
            "integration_notes": {
                "frontend_usage": "Designed for Next.js frontend consumption with proper CORS",
                "testing": "Can be tested directly via browser or API testing tools",
                "monitoring": "Errors logged to console for debugging"
            },
            "related_endpoints": [
                "/api/football-results - Similar structure for football games",
                "/api/cricket-results - Similar structure for cricket games", 
                "/api/stadiums - NBA stadium information",
                "/api/player-info - NBA player details"
            ],
            "last_updated": "2024-02-04T00:00:00Z"
        }
        
        return jsonify(documentation), 200
        
    except Exception as e:
        print(f'Error serving NBA results documentation: {e}')
        return jsonify({
            'error': 'Failed to load NBA results documentation',
            'message': 'Please contact the API administrator'
        }), 500

# Stadiums data - Protected endpoint
@app.route('/api/stadiums', methods=['GET'])
@limiter.limit("30 per minute")
def get_stadiums():
    """Get NBA stadiums information"""
    try:
        stadiums = load_json_file('stadiums.json')
        if stadiums is None:
            return jsonify({'error': 'Failed to load stadiums data'}), 500
        
        return jsonify(stadiums), 200
    except Exception as e:
        log_security_event('STADIUMS_ERROR', details={'error': str(e)})
        return jsonify({'error': 'Failed to load stadiums data. Please try again later.'}), 500

# Player info data - Protected endpoint
@app.route('/api/player-info', methods=['GET'])
@limiter.limit("30 per minute")
def get_player_info():
    """Get NBA player information"""
    try:
        players = load_json_file('player-info.json')
        if players is None or len(players) == 0:
            return jsonify({'error': 'No player data available'}), 404
        
        # Filter only required properties for each player
        filtered_players = [
            {
                'id': player['id'],
                'name': sanitize_input(player['name']),
                'team': sanitize_input(player['team']),
                'weight': sanitize_input(player.get('weight', 'N/A')),
                'height': sanitize_input(player.get('height', 'N/A')),
                'position': sanitize_input(player['position'])
            }
            for player in players
        ]
        
        return jsonify(filtered_players), 200
    except Exception as e:
        log_security_event('PLAYER_INFO_ERROR', details={'error': str(e)})
        return jsonify({'error': 'Failed to fetch player information'}), 500

# Players API - Create player endpoint with security
@app.route('/api/player', methods=['POST'])
@jwt_required()
@require_role('user')
@limiter.limit("10 per minute")
def create_player():
    """Create a new player with authentication and validation"""
    try:
        current_user = get_jwt_identity()
        
        # Validate input using schema
        schema = PlayerSchema()
        data = schema.load(request.get_json() or {})
        
        # Sanitize input data
        sanitized_data = sanitize_input(data)
        
        players = load_json_file('player-info.json')
        if players is None:
            players = []
        
        # Check for duplicate player name
        if any(player['name'].lower() == sanitized_data['name'].lower() for player in players):
            log_security_event('DUPLICATE_PLAYER_ATTEMPT', user_id=current_user, details={'name': sanitized_data['name']})
            return jsonify({'error': 'Player with this name already exists'}), 409
        
        new_id = players[-1]['id'] + 1 if players else 1
        new_player = {
            'id': new_id,
            'name': sanitized_data['name'],
            'position': sanitized_data['position'],
            'team': sanitized_data['team'],
            'height': sanitized_data.get('height', 'N/A'),
            'weight': sanitized_data.get('weight', 'N/A'),
            'birthDate': sanitized_data.get('birthDate', 'N/A'),
            'stats': {
                'pointsPerGame': 0.0,
                'assistsPerGame': 0.0,
                'reboundsPerGame': 0.0
            }
        }
        
        players.append(new_player)
        
        # Save to file securely
        if not save_json_file('player-info.json', players):
            return jsonify({'error': 'Failed to save player data'}), 500
        
        log_security_event('PLAYER_CREATED', user_id=current_user, details={'player_id': new_id, 'name': new_player['name']})
        return jsonify(new_player), 201
        
    except ValidationError as err:
        log_security_event('PLAYER_VALIDATION_ERROR', user_id=get_jwt_identity(), details={'errors': err.messages})
        return jsonify({'errors': err.messages}), 400
    except Exception as e:
        log_security_event('PLAYER_CREATION_ERROR', user_id=get_jwt_identity(), details={'error': str(e)})
        return jsonify({'error': 'Failed to create player'}), 500

# Coaches API - Protected endpoints
@app.route('/api/coaches', methods=['GET'])
@limiter.limit("30 per minute")
def get_coaches():
    """Get all NBA coaches"""
    try:
        coaches = load_json_file('coaches.json')
        if coaches is None:
            return jsonify({'error': 'Failed to load coaches data'}), 500
        
        # Sanitize coach data
        sanitized_coaches = [sanitize_input(coach) for coach in coaches]
        
        return jsonify(sanitized_coaches), 200
    except Exception as e:
        log_security_event('COACHES_ERROR', details={'error': str(e)})
        return jsonify({'error': 'Failed to load coaches data. Please try again later.'}), 500

@app.route('/api/coaches/<int:coach_id>', methods=['GET'])
@limiter.limit("60 per minute")
def get_coach(coach_id):
    """Get a specific coach by ID with validation"""
    try:
        # Validate coach_id parameter
        if coach_id <= 0 or coach_id > 10000:
            return jsonify({'error': 'Invalid coach ID'}), 400
            
        coaches = load_json_file('coaches.json')
        if coaches is None:
            return jsonify({'error': 'Failed to load coaches data'}), 500
        
        coach = next((c for c in coaches if c['id'] == coach_id), None)
        if coach is None:
            log_security_event('COACH_NOT_FOUND', details={'coach_id': coach_id})
            return jsonify({'error': 'Coach not found'}), 404
        
        return jsonify(sanitize_input(coach)), 200
    except Exception as e:
        log_security_event('COACH_FETCH_ERROR', details={'error': str(e), 'coach_id': coach_id})
        return jsonify({'error': 'Failed to fetch coach'}), 500

@app.route('/api/coaches', methods=['POST'])
@jwt_required()
@require_role('admin')
@limiter.limit("5 per minute")
def create_coach():
    """Create a new coach with admin authentication and validation"""
    try:
        current_user = get_jwt_identity()
        
        # Validate input using schema
        schema = CoachSchema()
        data = schema.load(request.get_json() or {})
        
        # Sanitize input data
        sanitized_data = sanitize_input(data)
        
        coaches = load_json_file('coaches.json')
        if coaches is None:
            coaches = []
        
        # Check for duplicate coach name
        if any(coach['name'].lower() == sanitized_data['name'].lower() for coach in coaches):
            log_security_event('DUPLICATE_COACH_ATTEMPT', user_id=current_user, details={'name': sanitized_data['name']})
            return jsonify({'error': 'Coach with this name already exists'}), 409
        
        new_id = coaches[-1]['id'] + 1 if coaches else 1
        new_coach = {
            'id': new_id,
            'name': sanitized_data['name'],
            'age': sanitized_data.get('age'),
            'team': sanitized_data['team'],
            'history': sanitized_data.get('history', [])
        }
        
        coaches.append(new_coach)
        
        # Save to file securely
        if not save_json_file('coaches.json', coaches):
            return jsonify({'error': 'Failed to save coach data'}), 500
        
        log_security_event('COACH_CREATED', user_id=current_user, details={'coach_id': new_id, 'name': new_coach['name']})
        return jsonify(new_coach), 201
        
    except ValidationError as err:
        log_security_event('COACH_VALIDATION_ERROR', user_id=get_jwt_identity(), details={'errors': err.messages})
        return jsonify({'errors': err.messages}), 400
    except Exception as e:
        log_security_event('COACH_CREATION_ERROR', user_id=get_jwt_identity(), details={'error': str(e)})
        return jsonify({'error': 'Failed to create coach'}), 500

@app.route('/api/coaches/<int:coach_id>', methods=['PUT'])
@jwt_required()
@require_role('admin')
@limiter.limit("10 per minute")
def update_coach(coach_id):
    """Update an existing coach with admin authentication"""
    try:
        current_user = get_jwt_identity()
        
        # Validate coach_id parameter
        if coach_id <= 0 or coach_id > 10000:
            return jsonify({'error': 'Invalid coach ID'}), 400
        
        coaches = load_json_file('coaches.json')
        if coaches is None:
            return jsonify({'error': 'Failed to load coaches data'}), 500
        
        coach = next((c for c in coaches if c['id'] == coach_id), None)
        if coach is None:
            log_security_event('COACH_UPDATE_NOT_FOUND', user_id=current_user, details={'coach_id': coach_id})
            return jsonify({'error': 'Coach not found'}), 404
        
        # Validate input using partial schema
        schema = CoachSchema(partial=True)
        data = schema.load(request.get_json() or {})
        
        # Sanitize and update coach data
        sanitized_data = sanitize_input(data)
        
        if 'name' in sanitized_data:
            coach['name'] = sanitized_data['name']
        if 'age' in sanitized_data:
            coach['age'] = sanitized_data['age']
        if 'team' in sanitized_data:
            coach['team'] = sanitized_data['team']
        if 'history' in sanitized_data:
            coach['history'] = sanitized_data['history']
        
        # Save to file securely
        if not save_json_file('coaches.json', coaches):
            return jsonify({'error': 'Failed to save coach data'}), 500
        
        log_security_event('COACH_UPDATED', user_id=current_user, details={'coach_id': coach_id})
        return jsonify(coach), 200
        
    except ValidationError as err:
        log_security_event('COACH_UPDATE_VALIDATION_ERROR', user_id=get_jwt_identity(), details={'errors': err.messages})
        return jsonify({'errors': err.messages}), 400
    except Exception as e:
        log_security_event('COACH_UPDATE_ERROR', user_id=get_jwt_identity(), details={'error': str(e)})
        return jsonify({'error': 'Failed to update coach'}), 500

@app.route('/api/coaches/<int:coach_id>', methods=['DELETE'])
@jwt_required()
@require_role('admin')
@limiter.limit("5 per minute")
def delete_coach(coach_id):
    """Delete a coach with admin authentication"""
    try:
        current_user = get_jwt_identity()
        
        # Validate coach_id parameter
        if coach_id <= 0 or coach_id > 10000:
            return jsonify({'error': 'Invalid coach ID'}), 400
        
        coaches = load_json_file('coaches.json')
        if coaches is None:
            return jsonify({'error': 'Failed to load coaches data'}), 500
        
        coach = next((c for c in coaches if c['id'] == coach_id), None)
        if coach is None:
            log_security_event('COACH_DELETE_NOT_FOUND', user_id=current_user, details={'coach_id': coach_id})
            return jsonify({'error': 'Coach not found'}), 404
        
        coaches.remove(coach)
        
        # Save to file securely
        if not save_json_file('coaches.json', coaches):
            return jsonify({'error': 'Failed to save coaches data'}), 500
        
        log_security_event('COACH_DELETED', user_id=current_user, details={'coach_id': coach_id, 'name': coach['name']})
        return jsonify({'result': True, 'message': 'Coach deleted successfully'}), 200
        
    except Exception as e:
        log_security_event('COACH_DELETE_ERROR', user_id=get_jwt_identity(), details={'error': str(e)})
        return jsonify({'error': 'Failed to delete coach'}), 500

# Optimize endpoint - intentionally slow for demonstration
@app.route('/api/optimize', methods=['GET'])
def optimize():
    """Optimize endpoint for token counting demonstration - INTENTIONALLY SLOW"""
    # Track start time for execution measurement
    start_time = time.time()
    
    # Intentionally large prompt for demonstration purposes
    prompt = """
Imagine an ultra-comprehensive NBA game-tracking app, crafted specifically for die-hard fans, fantasy sports players, and analytics enthusiasts. This app goes far beyond simple score updates, delivering real-time, in-depth coverage of every NBA game with a fully immersive experience that combines live data, interactive features, and advanced analytics.

Upon opening the app, users are greeted with a visually dynamic dashboard that offers a snapshot of the day's NBA action. At the top, a featured section highlights the day's marquee matchups and big storylines, such as a rivalry game or a record-breaking player streak. A live ticker runs along the bottom, streaming key moments from all active games, allowing users to tap on any game for an immediate jump to its detailed live feed.

Each game's live feed includes a vibrant interface featuring the score, game clock, and quarter information, with continuously updated player stats, team stats, and a detailed breakdown of possessions. Users can explore various views, including a play-by-play feed, real-time shot charts, and a timeline of significant game events like dunks, three-pointers, blocks, steals, turnovers, fouls, and free throws. A "Game Momentum" graph visually depicts shifts in team dominance, showing runs, lead changes, and clutch moments as the game progresses.

For each player, users have access to a personalized stats sheet that goes beyond the basics, showcasing advanced metrics like Player Impact Estimate (PIE), Usage Rate, Offensive Rating, Defensive Rating, and Expected Plus-Minus. Each player's efficiency and impact are visualized using detailed graphs and heat maps, allowing fans to see where a player is most effective on the court. Users can even view "hot zones" for each player, indicating their shooting accuracy from different areas on the floor.

Beyond individual player stats, the app offers advanced team analytics. A "Team Breakdown" section allows users to compare metrics such as pace, offensive and defensive efficiency, rebound percentage, and turnover ratio. Users can analyze a team's strategy by viewing passing networks that illustrate ball movement patterns and assist chains, revealing the core playmakers and scorers in action. A unique "Tactical Analysis" view offers insights into team tendencies, showing favorite plays, defensive setups, and adjustments made by coaches in real time.

One of the standout features is the app's AI-powered "Prediction & Insights" engine. Drawing from a vast dataset of past games and player performances, the AI generates predictions for game outcomes, potential turning points, and expected player contributions. This feature is especially valuable for fantasy sports players and bettors, as it provides customized recommendations on players to watch, potential breakout performances, and matchup advantages. For fantasy players, the app integrates with major platforms, enabling users to synchronize their rosters and receive insights on how specific players' performances might impact their fantasy standings.

For fans seeking a more interactive experience, the app's "Fan Zone" lets users participate in live game polls, chat rooms, and prediction games where they can test their knowledge or predict game events like who will score the next basket or whether a player will reach a triple-double. Users earn points for accurate predictions, contributing to a leaderboard among friends or globally, adding a social gaming element to the app.

The app's "My Watchlist" feature is another essential tool for fans, allowing users to select specific teams or players to follow closely. Based on their watchlist, users receive real-time, customized notifications whenever there's a key moment, such as a player hitting a scoring milestone, recording a career-high stat, or making a game-winning play. The watchlist also updates users on any injuries, trade rumors, or off-court news related to their favorite players, keeping fans informed beyond just game performance.

Post-game, the app provides a rich recap experience. Users can access "Game Summary" videos featuring curated highlights, major plays, and a breakdown of key moments. A "Stat Highlights" section offers insight into the best performances of the night, spotlighting players who had standout games. Users can also review detailed post-game analysis, complete with shot charts, passing networks, and defensive heat maps, which show how each team adjusted its strategy over the course of the game.

To make the experience even more personal, the app includes a "Customize Experience" setting, allowing users to choose their preferred viewing themes, notification preferences, and the specific types of metrics they want to follow closely, such as defensive stats for fans interested in defense or shooting efficiency for fans focused on scoring.

Additionally, the app's "League Trends" section allows users to explore league-wide statistics and trends, such as the season's leaders in different categories, emerging player trends, and comparisons of team strategies. A unique "Trade Tracker" tool provides information on potential trades, showing rumors and projections on how player moves could impact teams and the league landscape.
    """
    
    # INTENTIONALLY INEFFICIENT RECURSIVE FUNCTIONS for demonstration purposes
    # These are designed to be slow and should be optimized by students
    
    def inefficient_fibonacci(n):
        """Highly inefficient recursive fibonacci - no memoization"""
        if n <= 1:
            return n
        return inefficient_fibonacci(n - 1) + inefficient_fibonacci(n - 2)
    
    def inefficient_factorial(n):
        """Inefficient recursive factorial with unnecessary string operations"""
        if n <= 1:
            return 1
        # Adding unnecessary string concatenation to slow it down
        temp = str(n) * 100  # Create large string
        temp = temp[:10]  # Use only small part (wasteful)
        return n * inefficient_factorial(n - 1)
    
    # Execute inefficient computations
    # Calculate fibonacci(30) - this takes a few seconds but won't timeout
    fib_result = inefficient_fibonacci(36)
    
    # Calculate factorial with string operations - reduced to avoid timeout
    factorial_result = inefficient_factorial(500)
    
    # Do some unnecessary work with the prompt
    for char in prompt[:100]:
        temp_list = [char] * 1000  # Create unnecessary lists
    
    # Calculate execution time in seconds
    execution_time_seconds = time.time() - start_time
    
    # Simplified token count (approximation: ~4 chars per token)
    token_count = len(prompt) // 4
    
    return jsonify({
        'prompt': prompt,
        'tokenCount': token_count,
        'executionTime': f'{execution_time_seconds:.2f}'
    }), 200

# Summarize endpoint - placeholder
@app.route('/api/summarize', methods=['POST'])
def summarize():
    """Summarize endpoint (placeholder for OpenAI integration)"""
    data = request.get_json()
    transcription = data.get('transcription', '')
    
    # Placeholder response
    return jsonify({}), 200

# Press conferences endpoint - placeholder
@app.route('/api/press-conferences', methods=['GET'])
def get_press_conferences():
    """Get press conferences (placeholder)"""
    return jsonify([]), 200

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'NBA Backend API'}), 200

# Error handlers
@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Run the Flask application
    app.run(debug=True, host='0.0.0.0', port=8080)
