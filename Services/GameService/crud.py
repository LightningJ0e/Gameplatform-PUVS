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
def notify_user_service_played(token: str):
    headers = {
        "Authorization": f"Bearer {token}",
        "accept": "application/json"
    }

    try:
        r = requests.post(
            f"{USERSERVICE_URL}/updateGamesPlayed?playedGames=1",
            headers=headers,
        )

        if not r.ok:
            logging.error(f"Request to UserService failed: {r.status_code} {r.text}")
        else:
            logging.info(f"GamesPlayed updated: {r.json()}")

    except Exception as e:
        logging.exception(f"Error contacting UserService: {e}")