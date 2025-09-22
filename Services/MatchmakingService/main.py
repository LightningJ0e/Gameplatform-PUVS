import redis
import time
import json
import sys
import os 
import logging
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import requests
from fastapi.security import OAuth2PasswordBearer

from utils import send_create_game, get_user_info_from_userservice, send_create_game_bot, get_BOT_info_from_userservice

import uuid

LOCK_KEY = "lock:matchmaking"
LOCK_TTL_SEC = 5  # kurz halten

def acquire_lock() -> str | None:
    token = str(uuid.uuid4())
    ok = redis_client.set(LOCK_KEY, token, nx=True, ex=LOCK_TTL_SEC)
    return token if ok else None

def refresh_lock(token: str) -> None:
    # best-effort Verlängerung (reicht hier)
    if redis_client.get(LOCK_KEY) == token:
        redis_client.expire(LOCK_KEY, LOCK_TTL_SEC)

def release_lock(token: str) -> None:
    # nur löschen, wenn wir noch Besitzer sind
    pipe = redis_client.pipeline()
    while True:
        try:
            pipe.watch(LOCK_KEY)
            if pipe.get(LOCK_KEY) == token:
                pipe.multi()
                pipe.delete(LOCK_KEY)
                pipe.execute()
            else:
                pipe.unwatch()
            break
        except redis.WatchError:
            continue



#oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://userservice:8000/login")
# Add sharedShit to path for imports
sys.path.insert(0, 'sharedShit')
#from database import get_db
#from models import User, Game




redis_client = redis.Redis(host=os.getenv('REDIS_HOST', 'redis'), port=int(os.getenv('REDIS_PORT', '6379')), db=0, decode_responses=True)



app = FastAPI(title="MatchmakingService")


def find_match(_ignored_waiting_players: list[int] = None):
    # immer frisch lesen (so "sieht" #2 auch #3)
    while True:
        waiting_players = redis_client.lrange("matchmaking_queue", 0, -1)
        if len(waiting_players) < 2:
            return None

        # deine bestehende Logik – leicht ergänzt: sobald ein Paar gefunden wurde,
        # mache sofort weiter (es können weitere Paare möglich sein)
        for j in range(len(waiting_players)):
            for k in range(j + 1, len(waiting_players)):
                p1 = waiting_players[j]
                p2 = waiting_players[k]
                if p1 == p2:
                    continue

                player1_elo = redis_client.hget(f"user:{p1}", "elo")
                player2_elo = redis_client.hget(f"user:{p2}", "elo")
                player1_userid = redis_client.hget(f"user:{p1}", "userid")
                player2_userid = redis_client.hget(f"user:{p2}", "userid")
                if player1_elo is None or player2_elo is None or player1_userid is None or player2_userid is None:
                    continue

                elo_diff = abs(int(player1_elo) - int(player2_elo))
                if elo_diff <= 100:
                    game_info = send_create_game(player1_userid, player2_userid)

                    game_data = {
                        "status": "game_found",
                        "player1": p1,
                        "player2": p2,
                        "player1_elo": player1_elo,
                        "player2_elo": player2_elo,
                        "timestamp": time.time(),
                        "game_id": game_info.get("id"),
                    }
                    game_id = f"game_{int(time.time())}_{player1_userid}_{player1_elo}_{player2_userid}_{player2_elo}"
                    redis_client.hset(game_id, mapping=game_data)
                    redis_client.expire(game_id, 60)

                    remove_player_from_queue(p1)
                    remove_player_from_queue(p2)

                    # direkt weiterschauen, ob noch ein Paar geht
                    break
            else:
                # innere Schleife hat NICHT gebrochen -> kein Paar ab j
                continue
            # innere Schleife hat gebrochen -> wir haben ein Paar erstellt
            # outer neu starten, um die frische Queue zu prüfen
            break
        else:
            # gar kein Paar gefunden -> fertig
            return None


@app.post("/queue/add")
def add_player_to_queue(token: str):
    # Check if player is already in queue
    current_queue = redis_client.lrange("matchmaking_queue", 0, -1)

    uinfo = get_user_info_from_userservice(token)
    uid = uinfo.get("id")

    for t in current_queue:
        queued_user_id = redis_client.hget(f"user:{t}", "userid")
        if queued_user_id and int(queued_user_id) == uid:
            return {"message": "Player already in queue"}
    
    user_info = get_user_info_from_userservice(token)
    user_elo = user_info.get("elo")
    user_id = user_info.get("id")
    if user_elo is None or user_id is None:
        raise HTTPException(status_code=400, detail="User info incomplete (missing elo or id)")
    
    pipe = redis_client.pipeline()
    pipe.hset(f"user:{token}", mapping={
        "elo": user_elo,
        "userid": user_id,
        "join_time": time.time(),
    })
    pipe.lpush("matchmaking_queue", token)
    pipe.execute()

    # NEU: serialisiert matchen
    lock_token = acquire_lock()
    if lock_token:
        try:
            find_match(None)  # ignoriert Param, liest selbst frisch
        finally:
            release_lock(lock_token)

    return {"message": "Player added to queue", "elo": user_elo}


@app.get("/player_queue_info/get_info")
def get_player_queue_info(player_token: str): 
    all_games = redis_client.keys("game_*") 
    
    for game_key in all_games:
        game_data = redis_client.hgetall(game_key)
        
        player_1 = redis_client.hget(game_key, "player1")
        player_2 = redis_client.hget(game_key, "player2")

        if player_1 == player_token:
            complete_data = redis_client.hgetall(game_key)
            status = complete_data.get('status')
            player_token = complete_data.get('player1')
            player_elo = complete_data.get('player1_elo')
            opponent_token = complete_data.get('player2')
            opponent_elo = complete_data.get('player2_elo')
            timestamp = complete_data.get('timestamp')
            game_id = complete_data.get("game_id")
            return {
                "status": status,
                "player_token": player_token,
                "player_elo": player_elo,
                "opponent_token": opponent_token,
                "opponent_elo": opponent_elo,
                "game_timestamp": timestamp,
                "game_id" : game_id
            }

        elif player_2 == player_token:
            complete_data = redis_client.hgetall(game_key)
            status = complete_data.get('status')
            # Gegner
            opponent_token = complete_data.get('player1')
            opponent_elo = complete_data.get('player1_elo')
            player_token = complete_data.get('player2')
            player_elo = complete_data.get('player2_elo')
            timestamp = complete_data.get('timestamp')
            game_id = complete_data.get("game_id")
            return {
                "status": status,
                "player_token": player_token,
                "player_elo": player_elo,
                "opponent_token": opponent_token,
                "opponent_elo": opponent_elo,
                "game_timestamp": timestamp,
                "game_id": game_id
            }
    
    # No game found, check if player is in queue
    queue_position = redis_client.lpos("matchmaking_queue", player_token)
    
    if queue_position is not None:
        player_elo = redis_client.hget(f"user:{player_token}", "elo")
        return {
            "status": "waiting",
            "player_token": player_token,
            "player_elo": int(player_elo) if player_elo else None,
            "queue_position": queue_position,
            "queue_length": redis_client.llen("matchmaking_queue")
        }
    
    # Player not in queue and no game found
    return {
        "status": "not_in_queue",
        "player_token": player_token,
        "message": "Player is not in queue and has no active game"
    }


@app.post("/queue/remove")
def remove_player_from_queue(token: str):
    # Remove player from matchmaking queue
    redis_client.lrem("matchmaking_queue", 0, token)
    # Delete user's data from Redis
    redis_client.delete(f"user:{token}")
    return {"message": f"Player {token} removed from queue"}

@app.post("/queue/match_bot")
def match_bot(token: str):
    user_info = get_user_info_from_userservice(token)
    user_id = user_info.get("id")

    player1_elo = redis_client.hget(f"user:{token}", "elo")
    player1_userid = redis_client.hget(f"user:{token}", "userid")

    bot_info = get_BOT_info_from_userservice()
    bot_id = bot_info.get("id")
    bot_elo = bot_info.get("elo")

    game = send_create_game_bot(user_id)

    game_data = {
        "status": "game_found",
        "player1": token,
        "player2": "BOT",
        "player1_elo": player1_elo,
        "player2_elo": bot_elo,
        "timestamp": time.time(),
        "game_id": game.get("id")
    }
        
    # Store the game found information with a unique key
    game_id = f"game_{int(time.time())}_{player1_userid}_{player1_elo}_{bot_id}_{bot_elo}"
    redis_client.hset(game_id, mapping=game_data)
    redis_client.expire(game_id, 60)

    remove_player_from_queue(token)

    if not game or "game_id" not in game_data:
        raise HTTPException(status_code=500, detail="Game creation failed or invalid response from GameService")
    
    return {"game_id": game["id"]}


