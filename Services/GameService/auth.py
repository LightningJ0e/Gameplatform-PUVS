from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import os

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = os.getenv("JWT_ALG", "HS256")

# sagt FastAPI, dass der Token im Header "Authorization: Bearer <token>" kommt
#oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://userservice:8000/login"

#----------------------------
#Temp Code für Swagger Tests
oauth2_scheme = HTTPBearer()
#----------------------------
