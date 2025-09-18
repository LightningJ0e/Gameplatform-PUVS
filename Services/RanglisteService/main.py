from fastapi import FastAPI, HTTPException
from sharedShit.schemas import UserOutRangListe
from typing import List
from Services.RanglisteService.crud import getAllUsersFromUSerService, getSpecificUserFromUSerService

app = FastAPI(title="RanglisteService")

# ------------------------------
# Rangliste nach Elo
# ------------------------------
@app.get("/leaderboard/elo", response_model=List[UserOutRangListe])
def get_leaderboard_elo():
    userList = getAllUsersFromUSerService()

    usersWinrate = []
    for user in userList:
        winrate = user["games_won"] / user["games_played"] if user["games_played"] > 0 else 0
        winrate = round(winrate,2)
        user["winrate"] = winrate
        usersWinrate.append(user)

    sorted_users = sorted(usersWinrate, key=lambda user: user["elo"], reverse=True)

    usersRank = []
    for rank, curuser in enumerate(sorted_users, start=1):
        curuser["rank"] = rank
        usersRank.append(curuser)

    sorted_usersRank = sorted(usersRank, key=lambda user: user["rank"], reverse=True)
    return sorted_usersRank

# ------------------------------
# Rang eines bestimmten Users
# ------------------------------
@app.get("/leaderboard/specificRank", response_model=UserOutRangListe )
def get_user_rank(token: str):

    userList = getAllUsersFromUSerService()
    user = getSpecificUserFromUSerService(token)

    users = []
    for u in userList:
        winrate = u["games_won"] / u["games_played"] if u["games_played"] > 0 else 0
        winrate = round(winrate,2)
        u["winrate"] = winrate
        users.append(u)

    sorted_users = sorted(users, key=lambda user: user["elo"], reverse=True)

    for rank, curuser in enumerate(sorted_users, start=1):
        curuser["Rank"] = rank
        if curuser["username"] == user["username"]:
            return curuser
        else:
            raise HTTPException(status_code=404, detail="User not found")

