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

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)):
    token = credentials.credentials  # hier holen wir den String aus dem Objekt
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: int = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
        return username
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed",
        )
