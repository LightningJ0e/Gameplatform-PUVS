from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sharedShit.database import get_db, Base, engine
from .crud import create_user, get_user_by_username
from schemas import UserCreate, UserOut
from .auth import verify_password, create_access_token, SECRET_KEY, ALGORITHM

# Tabellen erzeugen, falls noch nicht vorhanden
Base.metadata.create_all(bind=engine)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
app = FastAPI(title="UserService")

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
    token = create_access_token({"sub": db_user.username})
    return {"access_token": token, "token_type": "bearer"}


#TODO maybe only increment the games played / games won instead of giving a value
#TODO maybe check if he is already logged in? --> check if saved token in frontend is still valid.
# ------------------------------
# PlayedGames-Update 
# ------------------------------
@app.post("/updateGamesPlayed/{username}")
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
        return {"username": db_user.username, "games_played": db_user.games_played, "games_won": db_user.games_won}
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate JWT-Token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

# ------------------------------
# WonGames-Update 
# ------------------------------
@app.post("/updateGamesWon/{username}")
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
        return {"username": db_user.username, "games_played": db_user.games_played, "games_won": db_user.games_won}
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate JWT-Token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
# ------------------------------
# Elo-Update 
# ------------------------------
@app.post("/updateElo/{username}")
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
        return {"username": db_user.username, "games_played": db_user.games_played, "games_won": db_user.games_won, "elo": db_user.elo}
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate JWT-Token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
@app.get("/users/{username}")
def get_userInfo(username: str, db: Session = Depends(get_db)):
    db_user = get_user_by_username(db, username)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"username": db_user.username, "games_played": db_user.games_played, "games_won": db_user.games_won, "elo": db_user.elo}