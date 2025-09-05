# nothing so far, need to check if needed
import requests
#import os
import logging

#USERSERVICE_URL = os.getenv("USERSERVICE_URL", "http://userservice:8000")
USERSERVICE_URL = "http://userservice:8000"

"""def notify_user_service_winner(winner_username: str, loser_username: str, token: str):
    headers = {"Authorization": f"Bearer {token}", "accept": "application/json"}

    # Gewinner: +1 Spiel, +1 Sieg
    requests.post(f"{USERSERVICE_URL}/updateGamesPlayed/{winner_username}?playedGames=1", headers=headers)
    requests.post(f"{USERSERVICE_URL}/updateGamesWon/{winner_username}?wonGames=1", headers=headers)

    # Verlierer: +1 Spiel
    requests.post(f"{USERSERVICE_URL}/updateGamesPlayed/{loser_username}?playedGames=1", headers=headers)"""
def notify_user_service_winner(winner_username: int, loser_username: int, token: str):
    headers = {"Authorization": f"Bearer {token}", "accept": "application/json"}

    try:
        # Gewinner: +1 Spiel, +1 Sieg
        r1 = requests.post(f"{USERSERVICE_URL}/updateGamesPlayed/{winner_username}?playedGames=1", headers=headers)
        r2 = requests.post(f"{USERSERVICE_URL}/updateGamesWon/{winner_username}?wonGames=1", headers=headers)

        # Verlierer: +1 Spiel
        r3 = requests.post(f"{USERSERVICE_URL}/updateGamesPlayed/{loser_username}?playedGames=1", headers=headers)

        # Antworten prüfen
        for r in (r1, r2, r3):
            if not r.ok:
                logging.error(f"Request to UserService failed: {r.status_code} {r.text}")

    except Exception as e:
        logging.exception(f"Error contacting UserService: {e}")
