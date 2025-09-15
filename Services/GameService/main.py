from fastapi import FastAPI, Depends
from Services.GameService.utils import decide_round, wins_needed, get_game, assert_game_open, get_or_create_current_round, apply_move, create_next_round, to_game_state, to_round_state
from sqlalchemy.orm import Session
from sharedShit.database import get_db, Base, engine
from sharedShit.schemas import Action, GameStateOut, MoveIn, GameCreate, RoundStateOut, BotGameCreate, BotGameStateOut
from Services.GameService.auth import oauth2_scheme
from Services.GameService.crud import create_game, get_user_info_from_userservice, create_botgame, get_BOT_info_from_userservice, get_BOT_Move, post_playedgamesupdate_to_userservice, post_wongamesupdate_to_userservice, post_eloupdate_to_userservice
from fastapi.security import HTTPAuthorizationCredentials

Base.metadata.create_all(bind=engine)
app = FastAPI(title="GameService")

@app.post("/games", response_model=GameStateOut)
def create_Game(body: GameCreate, db: Session = Depends(get_db)):
    game = create_game(db, body.player_id1, body.player_id2, body.mode)
    return game

@app.post("/gamesbot", response_model=BotGameStateOut)
def create_GamewithBot(body: BotGameCreate, db: Session = Depends(get_db)):
    game = create_botgame(db, body.player_id1, body.mode)
    return game

@app.post("/games/{game_id}/move", response_model=GameStateOut)
def submit_move(game_id: int,
    body: MoveIn,
    db: Session = Depends(get_db),
    token: str=Depends(oauth2_scheme)):

    user_info = get_user_info_from_userservice(token)
    player_id = user_info.get("id")

    game = get_game(db, game_id)
    assert_game_open(game)

    r = get_or_create_current_round(db, game)
    apply_move(db, game, r, player_id, body.action)

    ### RICHARDS BOT SHIT

    botInfo = get_BOT_info_from_userservice()
    botId = botInfo["id"]

    if game.player_1_id == botId or game.player_2_id == botId:
        data = get_BOT_Move()
        move = data["bot_move"]
        apply_move(db, game, r, botId, action=Action(int(move)))

    ### RICHARDS BOT SHIT

    # Wenn beide Züge da sind → Runde auswerten
    if r.p1_action is not None and r.p2_action is not None:
        winner = decide_round(Action(r.p1_action), Action(r.p2_action))
        r.winner = winner
        r.status = "complete"

        if winner == "p1":
            game.score_p1 += 1
        elif winner == "p2":
            game.score_p2 += 1

        needed = wins_needed(game.mode)
        if game.score_p1 >= needed:
            game.status = "finished"
            game.winner_player_id = game.player_1_id
            post_playedgamesupdate_to_userservice(game.player_1_id, 1)
            post_playedgamesupdate_to_userservice(game.player_2_id, 1)
            post_wongamesupdate_to_userservice(game.player_1_id, 1)
            post_eloupdate_to_userservice(game.player_1_id, 30)
            post_eloupdate_to_userservice(game.player_2_id , -30)
        elif game.score_p2 >= needed:
            game.status = "finished"
            game.winner_player_id = game.player_2_id
            post_playedgamesupdate_to_userservice(game.player_2_id, 1)
            post_playedgamesupdate_to_userservice(game.player_1_id, 1)
            post_wongamesupdate_to_userservice(game.player_2_id, 1)
            post_eloupdate_to_userservice(game.player_2_id, 30)
            post_eloupdate_to_userservice(game.player_1_id , -30)
        else:
            create_next_round(db, game, r.round_no + 1)

    db.commit()
    db.refresh(game)
    return to_game_state(db, game)

@app.get("/games/{game_id}/state", response_model=GameStateOut)
def get_game_state(game_id: int, db: Session = Depends(get_db)):
    game = get_game(db, game_id)
    return to_game_state(db, game)