from sqlalchemy import Column, Integer, String
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    games_played = Column(Integer, default=0)
    games_won = Column(Integer, default=0)
    elo = Column(Integer, default=500)

class Game(Base):
    __tablename__ = "games"
    id = Column(Integer, primary_key=True)
    player_1_id = Column(Integer, nullable=False)
    player_2_id = Column(Integer, nullable=False)
    mode = Column(String, nullable=False)            # "bo1"|"bo3"|"bo5"
    score_p1 = Column(Integer, default=0, nullable=False)
    score_p2 = Column(Integer, default=0, nullable=False)
    status = Column(String, default="in_progress", nullable=False)
    winner_player_id = Column(Integer, nullable=True)

    version = Column(Integer, default=0, nullable=False)  # optimistic locking
