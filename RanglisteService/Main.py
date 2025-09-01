from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from database import get_db, Base, engine
from crud import create_user, get_user_by_username
from schemas import UserCreate, UserOut
from auth import verify_password, create_access_token, SECRET_KEY, ALGORITHM


app = FastAPI(title="LeaderboardService")

# ------------------------------
# Rangliste nach Elo
# ------------------------------
@app.get("/leaderboard/elo")
def get_leaderboard_elo(db: Session = Depends(get_db), limit: int = 10):
    users = db.query(User).order_by(User.elo.desc()).limit(limit).all()
    return [
        {"username": u.username, "elo": u.elo, "games_won": u.games_won, "games_played": u.games_played}
        for u in users
    ]

# ------------------------------
# Rangliste nach Winrate
# ------------------------------
@app.get("/leaderboard/winrate")
def get_leaderboard_winrate(db: Session = Depends(get_db), limit: int = 10):
    users = db.query(User).all()
    ranked = sorted(
        users,
        key=lambda u: (u.games_won / u.games_played) if u.games_played > 0 else 0,
        reverse=True
    )
    return [
        {
            "username": u.username,
            "winrate": round((u.games_won / u.games_played) * 100, 2) if u.games_played > 0 else 0,
            "games_played": u.games_played,
            "games_won": u.games_won,
        }
        for u in ranked[:limit]
    ]

# ------------------------------
# Rang eines bestimmten Users
# ------------------------------
@app.get("/leaderboard/rank/{username}")
def get_user_rank(username: str, db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.elo.desc()).all()
    for rank, u in enumerate(users, start=1):
        if u.username == username:
            return {"username": u.username, "elo": u.elo, "rank": rank}
    raise HTTPException(status_code=404, detail="User not found")
