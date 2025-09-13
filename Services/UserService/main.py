from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import JWTError, jwt, ExpiredSignatureError
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sharedShit.database import get_db, Base, engine
from Services.UserService.crud import create_user, get_user_by_username, get_all_Users
from sharedShit.schemas import UserCreate, UserOut
from Services.UserService.auth import verify_password, create_access_token, SECRET_KEY, ALGORITHM
from typing import List
from contextlib import asynccontextmanager
import os

# Tabellen erzeugen, falls noch nicht vorhanden
Base.metadata.create_all(bind=engine)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

@asynccontextmanager
async def lifespan(app: FastAPI, db: Session = Depends(get_db)):
    # Startup-Logik
    try:
        Base.metadata.create_all(bind=engine)

        default_username = os.environ['BOTUSERNAME']
        default_password = os.environ['BOT_PASSWORD']

        user = get_user_by_username(db, default_username)
        if not user:
            create_user(db, default_username, default_password)
    finally:
        db.close()

    yield  # <- hier läuft die App

app = FastAPI(title="UserService",lifespan=lifespan)

# ------------------------------
# Registrierung
# ------------------------------
@app.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    #TODO limit password and USername to 20 chars
    existing_user = get_user_by_username(db, user.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    new_user = create_user(db, user.username, user.password)
    #Response for Api / HTTP-Response
    return new_user

# ------------------------------
# Login
# ------------------------------
@app.post("/login")
def login(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    username = form_data.username
    password = form_data.password
    db_user = get_user_by_username(db, username)
    if not db_user or not verify_password(password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": db_user.username, "id": db_user.id})
    return {"access_token": token, "token_type": "bearer"}

# ------------------------------
# PlayedGames-Update 
# ------------------------------
@app.post("/updateGamesPlayed", response_model=UserOut)
def update_GamesPlayed(playedGames: int, db: Session = Depends(get_db), token: str=Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        db_user = get_user_by_username(db, username)
        if username is None or not db_user:
            raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not Found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

        db_user.games_played += playedGames
        db.commit()
        db.refresh(db_user)
        return {"username": db_user.username, "games_played": db_user.games_played, "games_won": db_user.games_won, "elo": db_user.elo}
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate JWT-Token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except ExpiredSignatureError:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired.",
            headers={"WWW-Authenticate": "Bearer"},
         )

# ------------------------------
# WonGames-Update 
# ------------------------------
@app.post("/updateGamesWon", response_model=UserOut)
def update_GamesWon(wonGames: int, db: Session = Depends(get_db), token: str=Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        db_user = get_user_by_username(db, username)
        if username is None or not db_user:
            raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not Found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

        db_user.games_won += wonGames
        db.commit()
        db.refresh(db_user)
        return {"id": db_user.id, "username": db_user.username, "games_played": db_user.games_played, "games_won": db_user.games_won, "elo": db_user.elo}
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate JWT-Token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except ExpiredSignatureError:
        raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token expired.",
        headers={"WWW-Authenticate": "Bearer"},
        )

# ------------------------------
# Elo-Update 
# ------------------------------
@app.post("/updateElo", response_model=UserOut)
def update_GamesWon(elo: int, db: Session = Depends(get_db), token: str=Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        db_user = get_user_by_username(db, username)
        if username is None or not db_user:
            raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not Found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

        db_user.elo += elo
        db.commit()
        db.refresh(db_user)
        return {"id": db_user.id, "username": db_user.username, "games_played": db_user.games_played, "games_won": db_user.games_won, "elo": db_user.elo}
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate JWT-Token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except ExpiredSignatureError:
        raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token expired.",
        headers={"WWW-Authenticate": "Bearer"},
        )

@app.get("/getUserInfo", response_model=UserOut)
def get_userInfo(token: str=Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        db_user = get_user_by_username(db, username)
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        return {"id": db_user.id, "username": db_user.username, "games_played": db_user.games_played, "games_won": db_user.games_won, "elo": db_user.elo}
    
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate JWT-Token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except ExpiredSignatureError:
        raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token expired.",
        headers={"WWW-Authenticate": "Bearer"},
        )

@app.get("/getUserList", response_model=List[UserOut])
def get_userList(db: Session = Depends(get_db)):
    userList = get_all_Users(db)
    return userList

@app.get("/getBotInfo", response_model=UserOut)
def get_userList(db: Session = Depends(get_db)):
    user = get_user_by_username(db, os.environ['BOTUSERNAME'])
    return user