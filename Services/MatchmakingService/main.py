import redis
import time
import json
import sys
import os 
import logging
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
import requests
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://userservice:8000/login")
# Add sharedShit to path for imports
sys.path.insert(0, 'sharedShit')
from database import get_db
from models import User, Game

redis_client = redis.Redis(host=os.getenv('REDIS_HOST', 'redis'), port=int(os.getenv('REDIS_PORT', '6379')), db=0, decode_responses=True)

Game_Service = "http://gameservice:8001"
USERSERVICE_URL = "http://userservice:8000"

app = FastAPI(title="MatchmakingService")

@app.get("/user/elo")
def get_user_elo(user_id: int,db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    return user.elo


def find_match(waiting_players: list[int]):
    for j in range(len(waiting_players)):
        for k in range(len(waiting_players)):
            # Ensure we don't match a player with themselves
            if j != k and waiting_players[j] != waiting_players[k]:
                player1_elo = redis_client.hget(f"user:{waiting_players[j]}", "elo")
                player2_elo = redis_client.hget(f"user:{waiting_players[k]}", "elo")

                elo_diff = abs(int(player1_elo) - int(player2_elo))

                if elo_diff <= 100:
                    print("Match gefunden")
                    player1_token = waiting_players[j]
                    player2_token = waiting_players[k]
                    
                    # Send game creation request
                    send_create_game(player1_token, player2_token)
                    
                    # Create Redis entry for game found status
                    game_found_data = {
                        "status": "game_found",
                        "player1": player1_token,
                        "player2": player2_token,
                        "player1_elo": player1_elo,
                        "player2_elo": player2_elo,
                        "timestamp": time.time()
                    }
                    
                    # Store the game found information with a unique key
                    game_id = f"game_{int(time.time())}_{player1_token}_{player2_token}"
                    redis_client.hset(game_id, mapping=game_found_data)
                    
                    # Optional: Set expiration (e.g., 1 hour)
                    redis_client.expire(game_id, 3600)
                    
                    # Remove players from queue
                    remove_player_from_queue(player1_token)
                    remove_player_from_queue(player2_token)
                    
                    return [player1_token, player2_token]
    return None

@app.post("/queue/add")
def add_player_to_queue(token: str):
    # Check if player is already in queue
    current_queue = redis_client.lrange("matchmaking_queue", 0, -1)
    if token in current_queue:
        return {"message": "Player already in queue", "queue_position": current_queue.index(token)}
    
    user_info = get_user_info_from_userservice(token)
    print(user_info)
    user_elo = user_info.get("elo")
    
    redis_client.lpush("matchmaking_queue", token)
    redis_client.hset(f"user:{token}", mapping={"elo": user_elo, "join_time": time.time()})
    
    if redis_client.llen("matchmaking_queue") >= 2:
        waiting_players = redis_client.lrange("matchmaking_queue", 0, -1)
        find_match(waiting_players)
    
    return {"message": "Player added to queue", "elo": user_elo}

@app.get("/player_queue_info/{player_token}")
def get_player_queue_info(player_token: str): 
    game_keys = redis_client.keys("game_*")
    
    for game_key in game_keys:
        game_data = redis_client.hgetall(game_key)
        
        # Check if this player is in the game
        if game_data.get("player1") == player_token or game_data.get("player2") == player_token:
            # Determine who is the opponent
            if game_data.get("player1") == player_token:
                opponent_token = game_data.get("player2")
                player_role = "player1"
            else:
                opponent_token = game_data.get("player1")
                player_role = "player2"
            
            # Get ELOs from the game data (more reliable)
            if game_data.get("player1") == player_token:
                player_elo = game_data.get("player1_elo")
                opponent_elo = game_data.get("player2_elo")
            else:
                player_elo = game_data.get("player2_elo")
                opponent_elo = game_data.get("player1_elo")
            
            return {
                "status": "game_found",
                "game_id": game_key,
                "player_token": player_token,
                "player_elo": int(player_elo) if player_elo else None,
                "player_role": player_role,
                "opponent_token": opponent_token,
                "opponent_elo": int(opponent_elo) if opponent_elo else None,
                "game_timestamp": game_data.get("timestamp")
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




def get_user_info_from_userservice(token: str):
    headers = {
        "Authorization": f"Bearer {token}",
        "accept": "application/json"
    }
    try:
        r = requests.get(f"{USERSERVICE_URL}/getUserInfo", headers=headers)
        
        if not r.ok:
            logging.error(f"Request to UserService failed: {r.status_code} {r.text}")
            return None

        return r.json()

    except Exception as e:
        logging.error(f"Error contacting UserService: {e}")
        return None


@app.post("/queue/remove")
def remove_player_from_queue(user_id: str):
    # Remove player from matchmaking queue
    redis_client.lrem("matchmaking_queue", 0, user_id)
    # Delete user's data from Redis
    redis_client.delete(f"user:{user_id}")
    return {"message": f"Player {user_id} removed from queue"}

@app.post("/queue/match_bot")
def match_bot(user_id: str):
    return [user_id, "bot"]




def send_create_game(player1_id: int, player2_id: int, mode: str = "bo3"):
    headers = {
        "Content-Type": "application/json",
        "accept": "application/json"
    }
    
    game_data = {
        "player_id1": player1_id,
        "player_id2": player2_id,
        "mode": mode
    }

    try:
        r = requests.post(f"{Game_Service}/games/", headers=headers, json=game_data)


        if not r.ok:
            logging.error(f"Request to GameService failed: {r.status_code} {r.text}")
        else:
            logging.info(f"GamesPlayed updated: {r.json()}")

    except Exception as e:
        logging.exception(f"Error contacting GameService: {e}")