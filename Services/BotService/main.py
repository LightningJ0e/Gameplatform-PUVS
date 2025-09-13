from fastapi import FastAPI
import random

app = FastAPI(title="BotService")

@app.get("/botMove")
def get_bot_move():
    choices = ["rock", "paper", "scissors"]
    return {"bot_move": random.choice(choices)}