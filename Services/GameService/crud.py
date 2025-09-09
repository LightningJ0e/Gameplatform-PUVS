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
        status="open",
        score_p1=0,
        score_p2=0
    )
    db.add(new_game)
    db.commit()
    db.refresh(new_game)
    return new_game

"""def notify_user_service_winner(winner_username: str, loser_username: str, token: str):
    headers = {"Authorization": f"Bearer {token}", "accept": "application/json"}

    # Gewinner: +1 Spiel, +1 Sieg
    requests.post(f"{USERSERVICE_URL}/updateGamesPlayed/{winner_username}?playedGames=1", headers=headers)
    requests.post(f"{USERSERVICE_URL}/updateGamesWon/{winner_username}?wonGames=1", headers=headers)

    # Verlierer: +1 Spiel
    requests.post(f"{USERSERVICE_URL}/updateGamesPlayed/{loser_username}?playedGames=1", headers=headers)"""

def notify_user_service_played(token: str):
    headers = {
        "Authorization": f"Bearer {token}",
        "accept": "application/json"
    }

    try:
        r = requests.post(f"{USERSERVICE_URL}/updateGamesPlayed/dummy?playedGames=1", headers=headers)

        if not r.ok:
            logging.error(f"Request to UserService failed: {r.status_code} {r.text}")
        else:
            logging.info(f"GamesPlayed updated: {r.json()}")

    except Exception as e:
        logging.exception(f"Error contacting UserService: {e}")

def notify_user_service_player_won(token: str):
    headers = {
        "Authorization": f"Bearer {token}",
        "accept": "application/json"
    }

    try:
        r = requests.post(f"{USERSERVICE_URL}/updateGamesWon/dummy?wonGames=1", headers=headers)

        if not r.ok:
            logging.error(f"Request to UserService failed: {r.status_code} {r.text}")
        else:
            logging.info(f"GamesPlayed updated: {r.json()}")

    except Exception as e:
        logging.exception(f"Error contacting UserService: {e}")