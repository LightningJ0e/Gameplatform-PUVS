export default function MatchmakingButton({
  handleStartGame,
  gameState,
}: {
  handleStartGame: () => void;
  gameState: "idle" | "searching" | "found" | "playing" | "finished";
}) {
  return (
    <div>
      <button
        onClick={handleStartGame}
        className={`px-4 py-2 rounded-lg text-white text-xl m-4 transition-colors ${
          gameState === "searching"
            ? "bg-red-600 hover:bg-red-500"
            : "bg-slate-700 hover:bg-slate-500"
        }`}
      >
        {gameState === "searching"
          ? "Cancel Search"
          : gameState === "found"
          ? "Ready"
          : "Play Game"}
      </button>
      {gameState === "searching" && (
        <div className="flex flex-col items-center mt-12">
          <div className="relative w-16 h-16">
            <div className="absolute w-full h-full border-4 border-blue-500 rounded-full animate-ping"></div>
            <div
              className="absolute w-full h-full border-4 border-blue-300 rounded-full animate-ping"
              style={{ animationDelay: "0.5s" }}
            ></div>
            <div
              className="absolute w-full h-full border-4 border-blue-100 rounded-full animate-ping"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
