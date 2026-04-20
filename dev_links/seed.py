from app import app, db
from models import Link

def seed_data():
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Check if we already have links
        if Link.query.count() == 0:
            print("Seeding database with initial resources...")
            initial_links = [
                Link(title="MDN Web Docs", url="https://developer.mozilla.org", tag="HTML"),
                Link(title="CSS Tricks", url="https://css-tricks.com", tag="CSS"),
                Link(title="Flask Documentation", url="https://flask.palletsprojects.com", tag="Python"),
                Link(title="React Official", url="https://react.dev", tag="JavaScript"),
                Link(title="SQLAlchemy Guide", url="https://docs.sqlalchemy.org", tag="Database"),
            ]
            
            for link in initial_links:
                db.session.add(link)
                
            db.session.commit()
            print("Database seeded successfully!")
        else:
            print("Database already contains records. Skipping seed.")

if __name__ == '__main__':
    seed_data()
