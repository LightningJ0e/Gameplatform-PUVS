import redis
import time
import json

from fastapi import FastAPI, Depends
from utils import decide_round, wins_needed
from sqlalchemy.orm import Session
from sharedShit.database import get_db
from sharedShit.models import User

redis_client = redis.Redis(host='localhost', port=6379,db=0, decode_responses=True)


app = FastAPI(title="MatchmakingService")

@app.get("/user/elo")
def get_user_elo(user_id: int, db: Session = Depends(get_db), limit: int = 10):
    users = db.query(User).filter(user_id == id).first()
    return users.elo


def find_match(waiting_players: list[int]):
    for j in range(len(waiting_players)):
        for k in range(len(waiting_players)):
            if j != k:
                player1_elo = redis_client.hget(f"user:{waiting_players[j]}", "elo")
                player2_elo = redis_client.hget(f"user:{waiting_players[k]}", "elo")

                elo_diff = abs(player1_elo - player2_elo)
                if elo_diff <= 100:
                    # Match gefunden - beide aus Queue entfernen!
                    remove_player_from_queue(waiting_players[j])
                    remove_player_from_queue(waiting_players[k])
                    
                    #TODO: Match im GameService erstellen
                    
                    
                    return [waiting_players[j], waiting_players[k]]

    return None

@app.post("/queue/add")
def add_player_to_queue(user_id: str):
    user_elo = get_user_elo(user_id)
    redis_client.lpush("matchmaking_queue", user_id)
    redis_client.hset(f"user:{user_id}", mapping={"elo": user_elo, "join_time": time.time()})
    if redis_client.llen("matchmaking_queue") >= 2:
        find_match(redis_client.lrange("matchmaking_queue", 0, -1))

@app.post("/queue/remove")
def remove_player_from_queue(user_id: str):
    redis_client.lrem("matchmaking_queue", 0, user_id)
    redis_client.hdel(f"user:{user_id}")

@app.post("/queue/match_bot")
def match_bot(user_id: str):
    return [user_id, "bot"]