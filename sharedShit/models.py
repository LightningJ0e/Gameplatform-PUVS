from sqlalchemy import Column, Integer, String, ForeignKey,LargeBinary
from sharedShit.database import Base

def get_default_image():
    with open("sharedShit/STP-avatar.png", "rb") as f:
        return f.read()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    games_played = Column(Integer, default=0)
    games_won = Column(Integer, default=0)
    elo = Column(Integer, default=500)
    picture = Column(LargeBinary, default=get_default_image())

class Game(Base):
    __tablename__ = "games"
    id = Column(Integer, primary_key=True)
    player_1_id = Column(Integer, nullable=False)
    player_2_id = Column(Integer, nullable=False)
    mode = Column(String, nullable=False)            # "bo1"|"bo3"|"bo5"
    lives_p1 = Column(Integer, default=2, nullable=False)  #needs to be dynamic if gamemode is implemented
    lives_p2 = Column(Integer, default=2, nullable=False)  #needs to be dynamic if gamemode is implemented
    status = Column(String, default="open", nullable=False) # "open"|"in_progress|"finished"
    winner_player_id = Column(Integer, nullable=True)

class Round(Base):
    __tablename__ = "rounds"
    id = Column(Integer, primary_key=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    round_no = Column(Integer, nullable=False)               # 1..N
    p1_action = Column(Integer, nullable=True)                # "rock"|"paper"|"scissors"
    p2_action = Column(Integer, nullable=True)
    winner = Column(String, nullable=True)                   # "p1"|"p2"|"tie"
    status = Column(String, default="waiting", nullable=False)  # "waiting"|"complete"
    readyStatus_p1 = Column(String, default="notReady", nullable=False) # "noReady"|"Ready"
    readyStatus_p2 = Column(String, default="notReady", nullable=False) # "noReady"|"Ready"