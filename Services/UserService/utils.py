# utils.py
import re

#TODO we could save the winrate in the database instead of calculating it in the matchmaking or ranking
def calculate_win_rate(games_won: int, games_played: int) -> float:
    """Berechnet die Gewinnrate"""
    if games_played == 0:
        return 0.0
    return round(games_won / games_played * 100, 2)
