from models import User
from sqlalchemy.orm import Session
from auth import hash_password, verify_password

def create_user(db: Session, username: str, password: str):
    hashed = hash_password(password)
    user = User(username=username, password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# gets userInfo stored in DB based on username
def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()
