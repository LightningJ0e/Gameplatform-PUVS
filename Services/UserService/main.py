from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from jose import JWTError, jwt, ExpiredSignatureError
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sharedShit.database import get_db, Base, engine, SessionLocal
from Services.UserService.crud import create_user, get_user_by_id, get_all_Users, get_user_by_name
from sharedShit.schemas import UserCreate, UserOut
from Services.UserService.auth import verify_password, create_access_token, SECRET_KEY, ALGORITHM
from typing import List
from contextlib import asynccontextmanager
import os
from fastapi.responses import Response

# Tabellen erzeugen, falls noch nicht vorhanden
Base.metadata.create_all(bind=engine)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

@asynccontextmanager
async def lifespan(app: FastAPI, db: Session = Depends(get_db)):
    # Startup-Logik
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:

        default_username = os.environ['BOTUSERNAME']
        default_password = os.environ['BOT_PASSWORD']

        user = get_user_by_name(db, default_username)
        if not user:
            create_user(db, default_username, default_password)

    yield  # <- hier läuft die App

app = FastAPI(title="UserService",lifespan=lifespan)

# ------------------------------
# Registrierung
# ------------------------------
@app.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    #TODO limit password and USername to 20 chars
    existing_user = get_user_by_name(db, user.username)
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
    db_user = get_user_by_name(db, username)
    if not db_user or not verify_password(password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": db_user.username, "id": db_user.id})
    return {"access_token": token, "token_type": "bearer"}

# ------------------------------
# PlayedGames-Update 
# ------------------------------
@app.post("/updateGamesPlayed", response_model=UserOut)
def update_GamesPlayed(playedGames: int, id: int, db: Session = Depends(get_db)):
    try:
        db_user = get_user_by_id(db, id)
        if id is None or not db_user:
            raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not Found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

        db_user.games_played += playedGames
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
# WonGames-Update 
# ------------------------------
@app.post("/updateGamesWon", response_model=UserOut)
def update_GamesWon(wonGames: int, id: int, db: Session = Depends(get_db)):
    try:
        db_user = get_user_by_id(db, id)
        if id is None or not db_user:
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
def update_elo(elo: int, id: int, db: Session = Depends(get_db)):
    try:
        db_user = get_user_by_id(db, id)
        if id is None or not db_user:
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

# ------------------------------
# Get all Userinfo
# ------------------------------
@app.get("/getUserInfo", response_model=UserOut)
def get_userInfo(token: str=Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        db_user = get_user_by_name(db, username)
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        return {"id": db_user.id, "username": db_user.username, "games_played": db_user.games_played, "games_won": db_user.games_won, "elo": db_user.elo, "picture": db_user.picture}
    
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
# Get all Userinfo for all Users
# ------------------------------
@app.get("/getUserList", response_model=List[UserOut])
def get_userList(db: Session = Depends(get_db)):
    userList = get_all_Users(db)
    return userList

# ------------------------------
# Get BotInfo
# ------------------------------
@app.get("/getBotInfo", response_model=UserOut)
def get_userList(db: Session = Depends(get_db)):
    user = get_user_by_name(db, os.environ['BOTUSERNAME'])
    return user

# ------------------------------
# Set Userpicture
# ------------------------------
@app.post("/users/{user_id}/upload_image")
async def upload_image(token: str=Depends(oauth2_scheme), file: UploadFile = File(...), db: Session = Depends(get_db)):

    MAX_SIZE = 2*1024*1024  # 2mb

    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Only JPEG/PNG images allowed")

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 2MB)")
    
    user = get_userInfo(token, db)
    id = user["id"]
    db_user = get_user_by_id(db, id)
    db_user.picture = content
    db.commit()
    db.refresh(db_user)
    return {"message": "Image uploaded"}


# ------------------------------
# Get Userpicture
# ------------------------------
@app.get("/users/{user_id}/image")
def get_user_image(user_id: int, db: Session = Depends(get_db)):
    db_user = get_user_by_id(db, user_id)
    if not db_user or not db_user.picture:
        raise HTTPException(status_code=404, detail="Image not found")

    # Annahme: wir speichern PNG oder JPEG
    return Response(content=db_user.picture, media_type="image/png")
