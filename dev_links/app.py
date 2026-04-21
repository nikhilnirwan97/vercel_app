from flask import Flask, render_template, request, jsonify
from models import db, Link
import os

app = Flask(__name__)

# Configure database: Use DATABASE_URL from env if available (Vercel), else fallback to local SQLite
basedir = os.path.abspath(os.path.dirname(__file__))
db_url = os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL_NON_POOLING")

if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_url or 'sqlite:///' + os.path.join(basedir, 'links.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the app with the database
db.init_app(app)

# Create database tables if they don't exist
with app.app_context():
    try:
        db.create_all()
    except Exception as e:
        print(f"Database connection error: {e}")

@app.route('/')
def index():
    """Serve the main HTML interface."""
    return render_template('index.html')

@app.route('/api/links', methods=['GET'])
def get_links():
    """Get all links, optionally filtered by search term or tag."""
    try:
        search_term = request.args.get('search', '').lower()
        tag_filter = request.args.get('tag', '')
        
        query = Link.query
        
        if tag_filter:
            query = query.filter(Link.tag == tag_filter)
            
        links = query.all()
        
        if search_term:
            links = [link for link in links if search_term in link.title.lower()]
            
        return jsonify([link.to_dict() for link in links])
    except Exception as e:
        # Debugging: return the exact error and if the environment variable is loaded
        env_exists = bool(os.environ.get("POSTGRES_URL_NON_POOLING"))
        return jsonify({'error': str(e), 'env_loaded': env_exists}), 500

@app.route('/api/links', methods=['POST'])
def create_link():
    """Create a new resource link."""
    data = request.json
    
    if not all(k in data for k in ('title', 'url', 'tag')):
        return jsonify({'error': 'Missing required fields'}), 400
        
    new_link = Link(
        title=data['title'],
        url=data['url'],
        tag=data['tag']
    )
    db.session.add(new_link)
    db.session.commit()
    
    return jsonify(new_link.to_dict()), 201

@app.route('/api/links/<int:link_id>', methods=['PUT'])
def update_link(link_id):
    """Update an existing link."""
    link = Link.query.get_or_404(link_id)
    data = request.json
    
    if 'title' in data:
        link.title = data['title']
    if 'url' in data:
        link.url = data['url']
    if 'tag' in data:
        link.tag = data['tag']
        
    db.session.commit()
    return jsonify(link.to_dict())

@app.route('/api/links/<int:link_id>', methods=['DELETE'])
def delete_link(link_id):
    """Delete a resource link."""
    link = Link.query.get_or_404(link_id)
    db.session.delete(link)
    db.session.commit()
    return jsonify({'message': 'Resource deleted successfully'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
