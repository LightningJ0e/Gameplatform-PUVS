# nothing so far, need to check if needed
import requests
import logging

USERSERVICE_URL = "http://userservice:8000"

def getAllUsersFromUSerService():

    headers = {
        "accept": "application/json"
    }

    try:
        r = requests.get(f"{USERSERVICE_URL}/getUserList", headers=headers)

        if not r.ok:
            logging.error(f"Request to UserService failed: {r.status_code} {r.text}")
        else:
            logging.info(f"Userlist acquired: {r.json()}")
            return r.json()


    except Exception as e:
        logging.exception(f"Error contacting UserService: {e}")


def getSpecificUserFromUSerService(token: str):

    headers = {
        "Authorization": f"Bearer {token}",
        "accept": "application/json"
    }

    try:
        r = requests.get(f"{USERSERVICE_URL}/getUserInfo", headers=headers)

        if not r.ok:
            logging.error(f"Request to UserService failed: {r.status_code} {r.text}")
        else:
            logging.info(f"User acquired: {r.json()}")
            return r.json()


    except Exception as e:
        logging.exception(f"Error contacting UserService: {e}")


    