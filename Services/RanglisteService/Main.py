from fastapi import FastAPI
from sharedShit.schemas import UserOut, UserOutWinRate
from typing import List
from crud import getAllUsersFromUSerService, getSpecificUserFromUSerService

app = FastAPI(title="RanglisteService")

# ------------------------------
# Rangliste nach Elo
# ------------------------------
@app.get("/leaderboard/elo", response_model=List[UserOut])
def get_leaderboard_elo():
    userList = getAllUsersFromUSerService()
    sorted_users = sorted(userList, key=lambda user: user["elo"], reverse=True)
    return sorted_users

    
# ------------------------------
# Rangliste nach Winrate
# ------------------------------
@app.get("/leaderboard/winrate", response_model=List[UserOutWinRate])
def get_leaderboard_winrate():

    userList = getAllUsersFromUSerService()
    users = []
    for user in userList:
        winrate = user.games_won / user.games_played if user.games_played > 0 else 0
        user_dict = user.model_dump()
        user_dict["winrate"] = winrate
        users.append(user_dict)

    sorted_users = sorted(users, key=lambda u: u["winrate"], reverse=True)

    return sorted_users


# ------------------------------
# Rang eines bestimmten Users
# ------------------------------
@app.get("/leaderboard/rankElo", response_model=List[UserOut])
def get_user_rank(token: str):

    #WIP
    user = getSpecificUserFromUSerService(token)
    return user
'''    users = db.query(User).order_by(User.elo.desc()).all()
    for rank, u in enumerate(users, start=1):
        if u.username == username:
            return {"username": u.username, "elo": u.elo, "rank": rank}
    raise HTTPException(status_code=404, detail="User not found")
'''