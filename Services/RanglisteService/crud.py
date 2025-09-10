# nothing so far, need to check if needed
import requests
import logging
from sharedShit.models import Game
from sqlalchemy.orm import Session

USERSERVICE_URL = "http://userservice:8000"

def getAllUsersFromUSerService():

    headers = {
        "accept": "application/json"
    }

    try:
        r = requests.post(f"{USERSERVICE_URL}/getUserList", headers=headers)

        if not r.ok:
            logging.error(f"Request to UserService failed: {r.status_code} {r.text}")
        else:
            logging.info(f"GamesPlayed updated: {r.json()}")
            return r.json()


    except Exception as e:
        logging.exception(f"Error contacting UserService: {e}")


    