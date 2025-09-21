import requests
import logging

GAMESERVICE_URL = "http://gameservice:8001"
USERSERVICE_URL = "http://userservice:8000"

def send_create_game(player_id1: int, player_id2: int, mode: str = "bo3"):
    headers = {
        "Content-Type": "application/json",
        "accept": "application/json"
    }
    
    game_data = {
        "player_id1": player_id1,
        "player_id2": player_id2,
        "mode": mode
    }

    try:
        r = requests.post(f"{GAMESERVICE_URL}/games/", headers=headers, json=game_data)


        if not r.ok:
            logging.error(f"Request to GameService failed: {r.status_code} {r.text}")
        else:
            return r.json()
            logging.info(f"Game successfully created")

    except Exception as e:
        logging.exception(f"Error contacting GameService: {e}")

def send_create_game_bot(player_id1: int, mode: str = "bo3"):
    headers = {
        "Content-Type": "application/json",
        "accept": "application/json"
    }
    
    game_data = {
        "player_id1": player_id1,
        "mode": mode
    }

    try:
        r = requests.post(f"{GAMESERVICE_URL}/gamesbot/", headers=headers, json=game_data)


        if not r.ok:
            logging.error(f"Request to GameService failed: {r.status_code} {r.text}")
            return None
        else:
            logging.info(f"Game successfully created")
            return r.json()
        
    except Exception as e:
        logging.exception(f"Error contacting GameService: {e}")
        return None




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