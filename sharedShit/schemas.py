from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    username: str
    games_played: int
    games_won: int
    elo: int

    class Config:
        orm_mode = True

class UserOutWinRate(BaseModel):
    username: str
    games_played: int
    games_won: int
    elo: int
    winrate: float