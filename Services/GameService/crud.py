# nothing so far, need to check if needed
import requests
#import os
import logging
from sharedShit.models import Game
from sqlalchemy.orm import Session

#USERSERVICE_URL = os.getenv("USERSERVICE_URL", "http://userservice:8000")
#TODO get port from configmap
USERSERVICE_URL = "http://userservice:8000"
BOTSERVICE_URL = "http://botservice:8004"

def create_game(db: Session, player_id1: int, player_id2: int, mode: str):
    new_game = Game(
        player_1_id=player_id1,
        player_2_id=player_id2,
        mode=mode,
        status="in_progress",
        score_p1=0,
        score_p2=0
    )
    db.add(new_game)
    db.commit()
    db.refresh(new_game)
    return {"game_id": new_game.id}

def create_botgame(db: Session, player_id1: int, mode: str):
    bot_info = get_BOT_info_from_userservice()
    bot_id = bot_info["id"]

    new_game = Game(
        player_1_id=player_id1,
        player_2_id=bot_id,
        mode=mode,
        status="in_progress",
        score_p1=0,
        score_p2=0
    )
    db.add(new_game)
    db.commit()
    db.refresh(new_game)
    return {"game_id": new_game.id}

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
    
def get_BOT_info_from_userservice():
    headers = {
        "accept": "application/json"
    }
    try:
        r = requests.get(f"{USERSERVICE_URL}/getBotInfo", headers=headers)
        
        if not r.ok:
            logging.error(f"Request to UserService failed: {r.status_code} {r.text}")
            return None
        return r.json()

    except Exception as e:
        logging.error(f"Error contacting UserService: {e}")
        return None
    
def get_BOT_Move():
    headers = {
        "accept": "application/json"
    }
    try:
        r = requests.get(f"{BOTSERVICE_URL}/botMove", headers=headers)
        
        if not r.ok:
            logging.error(f"Request to UserService failed: {r.status_code} {r.text}")
            return None

        return r.json()

    except Exception as e:
        logging.error(f"Error contacting UserService: {e}")
        return None
    
def post_eloupdate_to_userservice(id: int, elo: int):
    headers = {
        "accept": "application/json"
    }
    try:
        r = requests.post(f"{USERSERVICE_URL}/updateElo?elo={elo}&id={id}", headers=headers)
        
        if not r.ok:
            logging.error(f"Request to UserService failed: {r.status_code} {r.text}")
            return None

        return r.json()

    except Exception as e:
        logging.error(f"Error contacting UserService: {e}")
        return None
    
def post_wongamesupdate_to_userservice(id: int, wongames: int):
    headers = {
        "accept": "application/json"
    }
    try:
        r = requests.post(f"{USERSERVICE_URL}/updateGamesWon?wonGames={wongames}&id={id}", headers=headers)
        
        if not r.ok:
            logging.error(f"Request to UserService failed: {r.status_code} {r.text}")
            return None

        return r.json()

    except Exception as e:
        logging.error(f"Error contacting UserService: {e}")
        return None
    
def post_playedgamesupdate_to_userservice(id: int, playedgames: int):
    headers = {
        "accept": "application/json"
    }
    try:
        r = requests.post(f"{USERSERVICE_URL}//updateGamesPlayed?playedGames={playedgames}&id={id}", headers=headers)
        
        if not r.ok:
            logging.error(f"Request to UserService failed: {r.status_code} {r.text}")
            return None

        return r.json()

    except Exception as e:
        logging.error(f"Error contacting UserService: {e}")
        return None