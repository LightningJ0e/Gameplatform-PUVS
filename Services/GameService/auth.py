# nothing so far, need to check if needed
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
import os

SECRET_KEY = os.environ['JWT_SECRET']
ALGORITHM = os.environ['JWT_ALG']

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")