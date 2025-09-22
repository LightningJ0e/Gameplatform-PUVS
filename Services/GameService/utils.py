from sharedShit.schemas import GameStateOut, RoundStateOut, Action
from fastapi import HTTPException, status
from sharedShit.models import Game, Round, User
from sqlalchemy.orm import Session
from Services.GameService.crud import get_BOT_info_from_userservice

victories = {
        Action.Rock: [Action.Scissors],  # Rock beats scissors
        Action.Paper: [Action.Rock],  # Paper beats rock
        Action.Scissors: [Action.Paper]  # Scissors beats paper
    }

def decide_round(player1_action, player2_action):
    defeats = victories[player1_action]
    if player1_action == player2_action:
        return "tie"
    elif player2_action in defeats:
        return "p1"
    else:
        return "p2"
    
def wins_needed(mode: str):
    return {"bo1": 1, "bo3": 2, "bo5": 3}[mode]

def get_game(db: Session, game_id: int):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")
    return game

def assert_game_open(game: Game):
    if game.status != "in_progress":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Game is not open (status={game.status})"
        )

def get_or_create_current_round(db: Session, game: Game):
    # „Current“ = höchste round_no, die noch nicht complete ist – oder neue 1
    r = (
        db.query(Round)
        .filter(Round.game_id == game.id)
        .order_by(Round.round_no.desc())
        .first()
    )
    if r and r.status == "waiting":
        return r
    if r and r.status == "complete":
        # Es gibt schon Runden; wenn das Spiel noch läuft, neue Runde anlegen
        if game.status == "in_progress":
            return create_next_round(db, game, r.round_no + 1)
        return r
    # Noch keine Runde vorhanden
    return create_next_round(db, game, 1)

def apply_move(db: Session, game: Game, round_obj: Round, player_id: int, action: Action):
    # Sicherstellen, dass der Player zum Game gehört
    if player_id not in (game.player_1_id, game.player_2_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Player not in this game")
    if round_obj.status != "waiting":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Round already completed")
    # Doppelzüge verhindern
    if player_id == game.player_1_id:
        if round_obj.p1_action is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Player 1 already moved")
        round_obj.p1_action = action.value
    else:
        if round_obj.p2_action is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Player 2 already moved")
        round_obj.p2_action = action.value
    db.add(round_obj)

def create_next_round(db: Session, game: Game, round_no: int):
    r = Round(game_id=game.id, round_no=round_no, status="waiting")
    
    db.add(r)
    db.commit()  # damit r.id belegt ist --> war vorher .flush()
    db.refresh(round, game)

    botInfo = get_BOT_info_from_userservice()
    botId = botInfo["id"]

    if game.player_1_id == botId or game.player_2_id == botId:
        round = get_or_create_current_round(db, game)
        apply_ready(db, game, round, botId)
    return r

def to_round_state(r: Round):
    return RoundStateOut(
        round_no=r.round_no,
        p1_action=None if r.p1_action is None else Action(r.p1_action),
        p2_action=None if r.p2_action is None else Action(r.p2_action),
        winner=r.winner,
        status=r.status,
    )

def to_game_state(db: Session, game: Game):
    current = (
        db.query(Round)
        .filter(Round.game_id == game.id)
        .order_by(Round.round_no.desc())
        .first()
    )
    return GameStateOut(
        id=game.id,
        player_1_id=game.player_1_id,
        player_2_id=game.player_2_id,
        mode=game.mode,
        score_p1=game.score_p1,
        score_p2=game.score_p2,
        status=game.status,
        winner_player_id=game.winner_player_id,
        current_round=to_round_state(current) if current else None,
    )

def apply_ready(db: Session, game: Game, round_obj: Round, player_id: int):
    # Sicherstellen, dass der Player zum Game gehört
    if player_id not in (game.player_1_id, game.player_2_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Player not in this game")
    if round_obj.status != "waiting":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Round already completed")
    # Doppelzüge verhindern
    if player_id == game.player_1_id:
        if round_obj.p1_action is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Player 1 already ready")
        round_obj.readyStatus_p1 = "ready"
    else:
        if round_obj.p2_action is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Player 2 already ready")
        round_obj.readyStatus_p2 = "ready"
    db.add(round_obj)

