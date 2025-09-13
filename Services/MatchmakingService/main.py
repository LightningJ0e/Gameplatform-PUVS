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
# In the container, this service's code is copied into /app, so utils is a local module
from utils import send_create_game, get_user_info_from_userservice

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://userservice:8000/login")
# Add sharedShit to path for imports
sys.path.insert(0, 'sharedShit')
from database import get_db
from models import User, Game

redis_client = redis.Redis(host=os.getenv('REDIS_HOST', 'redis'), port=int(os.getenv('REDIS_PORT', '6379')), db=0, decode_responses=True)



app = FastAPI(title="MatchmakingService")


def find_match(waiting_players: list[int]):
    for j in range(len(waiting_players)):
        for k in range(len(waiting_players)):
            # Damit man sich nicht selbst matched 
            if waiting_players[j] != waiting_players[k]:
                player1_elo = redis_client.hget(f"user:{waiting_players[j]}", "elo")
                player2_elo = redis_client.hget(f"user:{waiting_players[k]}", "elo")
                player1_userid = redis_client.hget(f"user:{waiting_players[j]}", "userid")
                player2_userid = redis_client.hget(f"user:{waiting_players[k]}", "userid")
                player1_token = waiting_players[j]
                player2_token = waiting_players[k]

                # Gleicht den ELO unterschied zwischen zwei Spieler ab
                elo_diff = abs(int(player1_elo) - int(player2_elo))
                if elo_diff <= 100:
                    send_create_game(player1_userid, player2_userid)
                    
                    # Create Redis entry for game found status
                    game_data = {
                        "status": "game_found",
                        "player1": player1_token,
                        "player2": player2_token,
                        "player1_elo": player1_elo,
                        "player2_elo": player2_elo,
                        "timestamp": time.time()
                    }
                    
                    # Store the game found information with a unique key
                    game_id = f"game_{int(time.time())}_{player1_userid}_{player1_elo}_{player2_userid}_{player2_elo}"
                    redis_client.hset(game_id, mapping=game_data)
                    redis_client.expire(game_id, 3600)
                    
                    # Remove players from queue
                    remove_player_from_queue(player1_token)
                    remove_player_from_queue(player2_token)
    return None


@app.post("/queue/add")
def add_player_to_queue(token: str):
    # Check if player is already in queue
    current_queue = redis_client.lrange("matchmaking_queue", 0, -1)
    if token in current_queue:
        return {"message": "Player already in queue"}
    
    user_info = get_user_info_from_userservice(token)
    user_elo = user_info.get("elo")
    user_id = user_info.get("id")
    
    redis_client.lpush("matchmaking_queue", token)
    redis_client.hset(f"user:{token}", mapping={"elo": user_elo, "join_time": time.time(), "userid": user_id})
    
    if redis_client.llen("matchmaking_queue") >= 2:
        waiting_players = redis_client.lrange("matchmaking_queue", 0, -1)
        find_match(waiting_players)
        return {"message": "Game found instantly"}
    
    return {"message": "Player added to queue", "elo": user_elo}


@app.get("/player_queue_info/{player_token}")
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
            return {
                "status": status,
                "player_token": player_token,
                "player_elo": player_elo,
                "opponent_token": opponent_token,
                "opponent_elo": opponent_elo,
                "game_timestamp": timestamp
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
            return {
                "status": status,
                "player_token": player_token,
                "player_elo": player_elo,
                "opponent_token": opponent_token,
                "opponent_elo": opponent_elo,
                "game_timestamp": timestamp
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
def match_bot(user_id: str):
    return [user_id, "bot"]


