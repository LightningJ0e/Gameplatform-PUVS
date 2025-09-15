from sharedShit.models import User
from sqlalchemy.orm import Session
from Services.UserService.auth import hash_password, verify_password

def create_user(db: Session, username: str, password: str):
    hashed = hash_password(password)
    user = User(username=username, password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# gets userInfo stored in DB based on username
def get_user_by_id(db: Session, id: int):
    return db.query(User).filter(User.id == id).first()

# Fetches all users from list
def get_all_Users(db: Session):
    return db.query(User).all()
