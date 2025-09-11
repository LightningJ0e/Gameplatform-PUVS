# nothing so far, need to check if needed
import requests
#import os
import logging
from sharedShit.models import Game
from sqlalchemy.orm import Session

#USERSERVICE_URL = os.getenv("USERSERVICE_URL", "http://userservice:8000")

USERSERVICE_URL = "http://userservice:8000"

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
    return new_game

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