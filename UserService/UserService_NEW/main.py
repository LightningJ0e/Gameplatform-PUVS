from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db, Base, engine
from crud import create_user, get_user_by_username
from schemas import UserCreate, UserOut
from auth import verify_password, create_access_token

# Tabellen erzeugen, falls noch nicht vorhanden
Base.metadata.create_all(bind=engine)

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
def login(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_username(db, user.username)
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": db_user.username})
    return {"access_token": token, "token_type": "bearer"}


#TODO maybe only increment the games played / games won instead of giving a value
# ------------------------------
# PlayedGames-Update 
# ------------------------------
@app.post("/updateGamesPlayed/{username}")
def update_GamesPlayed(username: str, games_played: int, db: Session = Depends(get_db)):
    db_user = get_user_by_username(db, username)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db_user.games_played += games_played
    db.commit()
    db.refresh(db_user)
    return {"username": db_user.username, "games_played": db_user.games_played, "games_won": db_user.games_won}

# ------------------------------
# WonGames-Update 
# ------------------------------
@app.post("/updateGamesPlayed/{username}")
def update_GamesPlayed(username: str, wonGames: int, db: Session = Depends(get_db)):
    db_user = get_user_by_username(db, username)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db_user.games_won += wonGames
    db.commit()
    db.refresh(db_user)
    return {"username": db_user.username, "games_played": db_user.games_played, "games_won": db_user.games_won}