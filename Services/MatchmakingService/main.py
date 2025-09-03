import redis
import time
import json

import sys
import os
from fastapi import FastAPI, Depends
# from utils import decide_round, wins_needed  # Nicht benötigt für Matchmaking
from sqlalchemy.orm import Session
# Pfad zu sharedShit hinzufügen
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'sharedShit'))
from database import get_db
from models import User






sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'GameService'))
from models import Game
from database import get_db as get_game_db  # Umbenennen um Konflikte zu vermeiden

# Redis mit Fallback
try:
    redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    # Test connection
    redis_client.ping()
    print("✅ Redis verbunden!")
    USE_REDIS = True
except Exception as e:
    print(f"❌ Redis nicht verfügbar: {e}")
    print("📝 Verwende In-Memory Fallback")
    redis_client = None
    USE_REDIS = False

# In-Memory Fallback
matchmaking_queue = []
player_data = {}

# Wrapper-Funktionen für Redis/In-Memory
def add_to_queue(user_id: str):
    if USE_REDIS:
        redis_client.lpush("matchmaking_queue", user_id)
    else:
        matchmaking_queue.append(user_id)

def remove_from_queue(user_id: str):
    if USE_REDIS:
        redis_client.lrem("matchmaking_queue", 0, user_id)
    else:
        if user_id in matchmaking_queue:
            matchmaking_queue.remove(user_id)

def get_queue():
    if USE_REDIS:
        return redis_client.lrange("matchmaking_queue", 0, -1)
    else:
        return matchmaking_queue.copy()

def get_queue_length():
    if USE_REDIS:
        return redis_client.llen("matchmaking_queue")
    else:
        return len(matchmaking_queue)

def set_player_data(user_id: str, elo: int):
    if USE_REDIS:
        redis_client.hset(f"user:{user_id}", mapping={"elo": elo, "join_time": time.time()})
    else:
        player_data[user_id] = {"elo": elo, "join_time": time.time()}

def get_player_elo(user_id: str):
    if USE_REDIS:
        return int(redis_client.hget(f"user:{user_id}", "elo") or 500)
    else:
        return player_data.get(user_id, {}).get("elo", 500)

def remove_player_data(user_id: str):
    if USE_REDIS:
        redis_client.delete(f"user:{user_id}")
    else:
        player_data.pop(user_id, None)

app = FastAPI(title="MatchmakingService")

# Tabellen erstellen beim Start
from database import Base, engine
Base.metadata.create_all(bind=engine)

@app.get("/user/elo")
def get_user_elo(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        return {"elo": user.elo}
    return {"error": "User not found"}


def find_match(waiting_players: list):
    for j in range(len(waiting_players)):
        for k in range(j + 1, len(waiting_players)):  # Optimierung: k startet bei j+1
            player1_elo = get_player_elo(waiting_players[j])
            player2_elo = get_player_elo(waiting_players[k])
            
            elo_diff = abs(player1_elo - player2_elo)
            if elo_diff <= 100:  # ELO-Toleranz
                # Match gefunden - beide aus Queue entfernen
                remove_from_queue(waiting_players[j])
                remove_from_queue(waiting_players[k])
                remove_player_data(waiting_players[j])
                remove_player_data(waiting_players[k])
                
                print(f"🎮 Match gefunden: {waiting_players[j]} (ELO: {player1_elo}) vs {waiting_players[k]} (ELO: {player2_elo})")
                return [waiting_players[j], waiting_players[k]]
    
    return None

@app.post("/queue/add")
def add_player_to_queue(user_id: str, db: Session = Depends(get_db)):
    # Prüfen ob Spieler bereits in der Queue ist
    current_queue = get_queue()
    if user_id in current_queue:
        return {"message": "Bereits in der Warteschlange", "position": current_queue.index(user_id) + 1}
    
    # ELO direkt aus Datenbank holen
    try:
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            # Fallback: Mock-ELO für Tests
            user_elo = 500  # Standard ELO
        else:
            user_elo = user.elo
    except Exception as e:
        print(f"Datenbank-Fehler: {e}")
        # Fallback: Mock-ELO für Tests
        user_elo = 500
    
    # ERST nach einem Match in der bestehenden Queue suchen (ohne den neuen Spieler)
    if get_queue_length() >= 1:
        waiting_players = get_queue()
        # Suche nach einem passenden Gegner für den neuen Spieler
        for existing_player in waiting_players:
            existing_elo = get_player_elo(existing_player)
            elo_diff = abs(user_elo - existing_elo)
            
            if elo_diff <= 100:  # ELO-Toleranz
                # Match gefunden! Beide aus Queue entfernen
                remove_from_queue(existing_player)
                remove_player_data(existing_player)
                
                print(f"🎮 Match gefunden: {user_id} (ELO: {user_elo}) vs {existing_player} (ELO: {existing_elo})")
                
                # Game in Datenbank erstellen
                game_id = create_game(user_id, existing_player, is_bot=False)
                
                if game_id:
                    return {
                        "message": "Match found!", 
                        "players": [user_id, existing_player],
                        "game_id": game_id
                    }
                else:
                    return {
                        "message": "Match found but failed to create game", 
                        "players": [user_id, existing_player]
                    }
    
    # Kein Match gefunden - Spieler zur Queue hinzufügen
    add_to_queue(user_id)
    set_player_data(user_id, user_elo)
    
    return {"message": f"In Warteschlange hinzugefügt. Position: {get_queue_length()}"}


@app.post("/queue/remove")
def remove_player_from_queue(user_id: str):
    remove_from_queue(user_id)
    remove_player_data(user_id)
    return {"message": f"Spieler {user_id} aus Warteschlange entfernt"}

@app.post("/queue/match_bot")
def match_bot(user_id: str):
    # Spieler aus Queue entfernen
    remove_from_queue(user_id)
    remove_player_data(user_id)
    
    # Game mit Bot erstellen
    game_id = create_game(user_id, "bot", is_bot=True)
    
    if game_id:
        return {
            "message": "Bot-Match erstellt", 
            "players": [user_id, "bot"],
            "game_id": game_id
        }
    else:
        return {
            "message": "Bot-Match failed to create game", 
            "players": [user_id, "bot"]
        }

@app.get("/queue/status")
def get_queue_status():
    """Aktueller Status der Warteschlange"""
    waiting_players = get_queue()
    return {
        "total_players": len(waiting_players),
        "players": waiting_players,
        "redis_connected": USE_REDIS
    }



def create_game(player1_id: str, player2_id: str, is_bot: bool = False):
    """Erstellt ein neues Game in der Datenbank"""
    
    try:
        # GameService Datenbank-Session
        game_db = next(get_game_db())
        
        # Neues Game erstellen
        new_game = Game(
            player_1_id=int(player1_id),
            player_2_id=int(player2_id) if not is_bot else 0,  # Bot = 0 oder spezielle ID
            mode="bo3",  # Best of 3 als Standard
            status="in_progress"
        )
        
        game_db.add(new_game)
        game_db.commit()
        game_db.refresh(new_game)
        
        print(f"✅ Game {new_game.id} erstellt: Player {player1_id} vs {'Bot' if is_bot else f'Player {player2_id}'}")
        
        game_db.close()
        return new_game.id
        
    except Exception as e:
        print(f"❌ Fehler beim Erstellen des Games: {e}")
        print(f"   Player1: {player1_id}, Player2: {player2_id}, is_bot: {is_bot}")
        try:
            game_db.rollback()
            game_db.close()
        except:
            pass
        return None