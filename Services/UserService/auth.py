from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
import secrets
import os

#TODO somehow save it in the cluster enviroment variables instead of creating it in the code
SECRET_KEY = os.environ['JWT_SECRET']
ALGORITHM = os.environ['JWT_ALG']

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# hashes a password
def hash_password(password: str):
    return pwd_context.hash(password)

# verifies the the given password with the hashed password
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# creates the JWT-Token taht contains the username and the expiretime
def create_access_token(data: dict, expires_delta: timedelta = timedelta(minutes=60)):
    to_encode = data.copy()
    expire = datetime.now() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
