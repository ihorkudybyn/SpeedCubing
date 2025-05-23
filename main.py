from datetime import timedelta, datetime
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import re
from pyTwistyScrambler import scrambler333, scrambler222, scrambler444, scrambler555, megaminxScrambler, pyraminxScrambler, skewbScrambler


app = Flask(__name__)
app.secret_key = "pizda"
app.permanent_session_lifetime = timedelta(days=30)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///speed-cuber.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


# Database Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    email_confirmed = db.Column(db.Boolean, default=True)
    email_confirm_token = db.Column(db.String(100), nullable=True)
    
    solves = db.relationship('Solve', backref='solver', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Cube(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    cube_type = db.Column(db.String(20), nullable=False)
    pattern = db.Column(db.String(200), nullable=True)
    
    solves = db.relationship('Solve', backref='cube', lazy=True)
    
    def __repr__(self):
        return f'<Cube {self.cube_type}>'


class Solve(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    time = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    cube_id = db.Column(db.Integer, db.ForeignKey('cube.id'), nullable=False)
    
    user = db.relationship('User')
    
    def __repr__(self):
        return f'<Solve {self.id} - {self.time}s>'


def generate_scramble(cube_type):
    try:
        if cube_type == '2x2':
            return scrambler222.get_WCA_scramble()
        elif cube_type == '3x3':
            return scrambler333.get_WCA_scramble()
        elif cube_type == '4x4':
            return scrambler444.get_WCA_scramble()
        elif cube_type == '5x5':
            return scrambler555.get_WCA_scramble()
        elif cube_type == 'Megaminx':
            return megaminxScrambler.get_WCA_scramble()
        elif cube_type == 'Pyraminx':
            return pyraminxScrambler.get_WCA_scramble()
        elif cube_type == 'Skewb':
            return skewbScrambler.get_WCA_scramble()
        else:
            return scrambler333.get_WCA_scramble()
    except Exception as e:
        import random
        moves = ["R", "L", "U", "D", "F", "B"]
        modifiers = ["", "'", "2"]
        fallback_scramble = " ".join([random.choice(moves) + random.choice(modifiers) for _ in range(20)])
        print(f"Scramble generation error: {str(e)}. Using fallback.")
        return fallback_scramble

def validate_password(password):
    """
    Validate password meets requirements:
    - At least 8 characters
    - Contains at least 1 uppercase letter
    - Contains at least 1 number
    - Contains at least 1 special character
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one number"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    
    return True, "Password is valid"



@app.route('/')
def home():
    return render_template('index.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return render_template('auth/login.html')

    email = request.form.get('email', '').strip()
    password = request.form.get('password', '')
    remember = request.form.get('remember')

    if not email or not password:
        return render_template('auth/login.html', error="Please enter both email and password")

    user = User.query.filter_by(email=email).first()
    if user and user.check_password(password):
        session.permanent = bool(remember)
        session['email'] = email
        return redirect(url_for('solve'))

    return render_template('auth/login.html', error="Invalid email or password")


@app.route('/logout')
def logout():
    session.pop('email', None)
    return redirect(url_for('home'))


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'GET':
        return render_template('auth/register.html')

    email = request.form.get('email', '').strip()
    password = request.form.get('password', '')
    confirm_password = request.form.get('confirm_password', '')
    
    errors = []
    
    if not email:
        return render_template('auth/register.html', error="Email is required")
    if not password:
        return render_template('auth/register.html', error="Password is required")
    
    if password and confirm_password and password != confirm_password:
        errors.append("Passwords do not match")
    
    if password:
        is_valid, error_msg = validate_password(password)
        if not is_valid:
            return render_template('auth/register.html', error=error_msg)
    
    if email:
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return render_template('auth/register.html', error="Email already registered")

    new_user = User(email=email)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    
    session['email'] = email
    return redirect(url_for('solve'))


@app.route('/solve')
def solve():
    if 'email' not in session:
        return redirect(url_for('login'))
    
    cube_types = ["2x2", "3x3", "4x4", "5x5", "Megaminx", "Pyraminx", "Skewb"]
    
    user = User.query.filter_by(email=session['email']).first()
    recent_solves = Solve.query.filter_by(user_id=user.id).order_by(Solve.date.desc()).limit(5).all()
    
    return render_template('solve.html', cube_types=cube_types, recent_solves=recent_solves)

@app.route('/api/scramble/<cube_type>')
def get_scramble(cube_type):
    if 'email' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    try:
        scramble = generate_scramble(cube_type)
        return jsonify({'scramble': scramble})
    except Exception as e:
        return jsonify({'error': f'Error generating scramble: {str(e)}', 
                       'scramble': 'R U R\' U\' R\' F R2 U\' R\' U\' R U R\' F\''}), 500
    

@app.route('/api/solve', methods=['POST'])
def save_solve():
    if 'email' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    data = request.json
    
    if not data or 'time' not in data or 'cubeType' not in data or 'scramble' not in data:
        return jsonify({'error': 'Invalid data'}), 400
    
    try:
        user = User.query.filter_by(email=session['email']).first()
        
        cube = Cube.query.filter_by(cube_type=data['cubeType'], pattern=data['scramble']).first()
        if not cube:
            cube = Cube(cube_type=data['cubeType'], pattern=data['scramble'])
            db.session.add(cube)
            db.session.flush()
        
        new_solve = Solve(
            time=float(data['time']),
            user_id=user.id,
            cube_id=cube.id
        )
        
        db.session.add(new_solve)
        db.session.commit()
        
        return jsonify({'success': True, 'solveId': new_solve.id})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/solve/penalty', methods=['POST'])
def apply_penalty():
    if 'email' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    data = request.json
    
    if not data or 'solveId' not in data or 'penaltyType' not in data:
        return jsonify({'error': 'Invalid data'}), 400
    
    try:
        solve = Solve.query.get(data['solveId'])
        
        if not solve:
            return jsonify({'error': 'Solve not found'}), 404
        
        if data['penaltyType'] == 'dnf':
            solve.time = -1
        elif data['penaltyType'] == 'plustwo':
            if solve.time > 0:
                solve.time += 2
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'solveId': solve.id,
            'newTime': 'DNF' if solve.time < 0 else solve.time
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/history')
def history():
    if 'email' not in session:
        return redirect(url_for('login'))
    
    user = User.query.filter_by(email=session['email']).first()
    
    page = request.args.get('page', 1, type=int)
    solves = Solve.query.filter_by(user_id=user.id)\
                  .order_by(Solve.date.desc())\
                  .paginate(page=page, per_page=10)
    
    stats = {}
    for cube_type in ["3x3", "2x2", "4x4", "5x5", "Megaminx", "Pyraminx", "Skewb"]:
        cube_solves = Solve.query.join(Cube).filter(
            Solve.user_id == user.id,
            Cube.cube_type == cube_type
        ).all()
        
        if cube_solves:
            times = [solve.time for solve in cube_solves]
            stats[cube_type] = {
                'count': len(times),
                'best': min(times),
                'average': sum(times) / len(times),
                'worst': max(times)
            }
    
    return render_template('history.html', solves=solves, stats=stats)

@app.route('/api/solve/<int:solve_id>', methods=['DELETE'])
def delete_solve(solve_id):
    if 'email' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    try:
        user = User.query.filter_by(email=session['email']).first()
        
        solve = Solve.query.get(solve_id)
        
        if not solve:
            return jsonify({'error': 'Solve not found'}), 404
        
        if solve.user_id != user.id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        db.session.delete(solve)
        db.session.commit()
        
        return jsonify({'success': True})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/leaderboard')
@app.route('/leaderboard/<cube_type>')
def leaderboard(cube_type=None):
    available_cube_types = db.session.query(Cube.cube_type).distinct().all()
    available_cube_types = [c[0] for c in available_cube_types]
    
    if not cube_type or cube_type not in available_cube_types:
        cube_type = available_cube_types[0] if available_cube_types else '3x3'
    
    best_solves_query = db.session.query(
        User.email,
        Solve.time,
        Solve.date,
        Cube.pattern
    ).join(
        User, User.id == Solve.user_id
    ).join(
        Cube, Cube.id == Solve.cube_id
    ).filter(
        Cube.cube_type == cube_type,
        Solve.time > 0
    ).order_by(
        Solve.time
    ).limit(50)
    
    top_solves = best_solves_query.all()
    
    return render_template(
        'leaderboard.html',
        top_solves=top_solves,
        cube_type=cube_type,
        available_cube_types=available_cube_types
    )


@app.route('/api/account/delete', methods=['POST'])
def delete_account():
    if 'email' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    data = request.json
    
    if not data or 'email' not in data or data['email'] != session['email']:
        return jsonify({'error': 'Invalid request'}), 400
    
    try:
        user = User.query.filter_by(email=session['email']).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        solves = Solve.query.filter_by(user_id=user.id).all()
        
        for solve in solves:
            db.session.delete(solve)
        
        db.session.delete(user)
        db.session.commit()
        
        session.clear()
        
        return jsonify({'success': True})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
