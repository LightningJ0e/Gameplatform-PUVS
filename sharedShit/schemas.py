from enum import IntEnum
from typing import Optional
from pydantic import BaseModel, Field

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

class Action(IntEnum):
    Rock = 0
    Paper = 1
    Scissors = 2

class GameCreate(BaseModel):
    player_id1: int
    player_id2: int
    mode: str

class MoveIn(BaseModel):
    #player_id: int = Field(..., description="Der Spieler, der die Aktion ausführt")
    action: Action = Field(..., description="0=Rock, 1=Paper, 2=Scissors")

class RoundStateOut(BaseModel):
    round_no: int
    p1_action: Optional[Action] = None
    p2_action: Optional[Action] = None
    winner: Optional[str] = None            # "p1"|"p2"|"tie"
    status: str                             # "waiting"|"complete"

class GameStateOut(BaseModel):
    id: int
    player_1_id: int
    player_2_id: int
    mode: str                                # "bo1"|"bo3"|"bo5"
    score_p1: int
    score_p2: int
    status: str                              # "in_progress"|"finished"
    winner_player_id: Optional[int] = None
    current_round: Optional[RoundStateOut] = None