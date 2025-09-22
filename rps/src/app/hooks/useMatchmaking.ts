import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { useOpponent } from "@/context/OpponentContext";
import { useAuth } from "@/context/AuthContext";

export function useMatchmaking() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const {
    setGameId,
    gameId,
    setOpponent_token,
    opponent_token,
    gameState,
    setGameState,
  } = useGame();
  const { setOpponent, opponent } = useOpponent();

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);

  // Navigation functions (simplified - animations handled in page component)
  const navigateWithAnimationOutUp = (href: string) => {
    router.push(href);
  };

  const navigateWithAnimationSideways = (href: string) => {
    router.push(href);
  };

  // Cleanup polling interval on component unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Auto-navigate when a gameId becomes available
  useEffect(() => {
    if (gameId) {
      setGameState("found");
      setTimeout(() => {
        // Log all opponent information before navigating to game
        if (opponent) {
          console.log("=== OPPONENT INFORMATION ===");
          console.log("ID:", opponent.id);
          console.log("Username:", opponent.username);
          console.log("Games Played:", opponent.games_played);
          console.log("Games Won:", opponent.games_won);
          console.log("ELO:", opponent.elo);
          console.log("Rank:", opponent.rank);
          console.log(
            "Winrate:",
            opponent.winrate ? `${opponent.winrate}%` : "Not calculated"
          );
          console.log("Token:", opponent.token);
          console.log(
            "Picture:",
            opponent.picture ? "Available (base64)" : "No picture"
          );
          console.log("=== END OPPONENT INFO ===");
        } else {
          console.log("⚠️ No opponent data available before navigation!");
        }

        navigateWithAnimationOutUp("/game");
      }, 700);
    }
  }, [gameId, opponent]);

  const checkMatchmakingStatus = async (): Promise<
    "match" | "bot" | "continue"
  > => {
    pollCountRef.current++;
    try {
      console.log("Home: Checking matchmaking status");

      const response = await fetch("/api/matchmaking/status", {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Home: Matchmaking status response:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log("Home: Matchmaking status failed:", errorData);
        return "continue";
      }

      const data = await response.json();
      console.log("Home: Matchmaking status data:", data);

      // Check if match was found based on the response structure from MatchmakingService
      if (data.status === "game_found") {
        console.log("Home: Match found!");

        // First load opponent data if available
        if (data.opponent_token) {
          if (data.opponent_token === "BOT") {
            console.log("Home: Loading bot opponent data");
            await loadBotData();
          } else {
            console.log("Home: Loading real opponent data");
            await loadOpponentData(data.opponent_token);
          }
          setOpponent_token(data.opponent_token);
        }

        // Then set gameId to trigger navigation
        if (data.game_id) {
          setGameId(data.game_id);
        }

        return "match";
      }

      if (pollCountRef.current === 5) {
        console.log("Home: Initializing botmatch after 5 attempts");
        const botResult = await initializeBotmatch();

        if (botResult === "immediate_match") {
          return "match"; // ✅ Sofortiges Match → Navigation
        } else if (botResult === "bot_added") {
          return "bot"; // Bot hinzugefügt, zurück zu idle
        } else {
          return "continue"; // Fehler, weiter versuchen
        }
      }

      console.log("Home: No match found yet, continuing to wait...");
      return "continue";
    } catch (error) {
      console.log("Home: Error checking matchmaking status:", error);
      return "continue";
    }
  };

  const initializeBotmatch = async (): Promise<
    "immediate_match" | "bot_added" | "failed"
  > => {
    try {
      const response = await fetch("/api/matchmaking/bot", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOpponent_token(data.opponent_token);
        console.log("Home: Botmatch response:", data);

        // Debug: Zeige detail array wenn vorhanden
        if (data.detail) {
          console.log("Home: Error details:", data.detail);
          console.log("Home: First error:", data.detail[0]);
          console.log("Home: Missing field location:", data.detail[0].loc);
        }

        // Accept immediate bot response with game_id even without status field
        if (data?.game_id) {
          console.log("Home: Bot match found immediately!");

          // First set the opponent token
          setOpponent_token("BOT");

          // Then load bot data before setting gameId (which triggers navigation)
          console.log("Home: Loading bot data before navigation");
          await loadBotData();

          // Finally set gameId to trigger navigation
          setGameId(String(data.game_id));

          return "immediate_match";
        }

        return "bot_added";
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log("Home: Botmatch initialization failed:", errorData);
        return "failed";
      }
    } catch (error) {
      console.log("Home: Error initializing botmatch:", error);
      return "failed";
    }
  };

  const startMatchmakingPolling = () => {
    console.log("Home: Starting matchmaking polling every 3 seconds");

    pollingIntervalRef.current = setInterval(async () => {
      const result = await checkMatchmakingStatus();

      if (result === "match") {
        console.log("Home: Navigating to game");

        // Stop polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        pollCountRef.current = 0;

        // Navigate to games
        setGameState("found");
        setTimeout(() => {
          navigateWithAnimationOutUp("/game");
        }, 700);
      } else if (result === "bot") {
        // Bot opponent added – keep polling until status returns game_found
        console.log(
          "Home: Bot match initiated, continuing to poll for game_found"
        );
      }
    }, 3000); // Poll every 3 seconds
  };

  const stopMatchmakingPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log("Home: Stopped matchmaking polling");
    }
    pollCountRef.current = 0;
  };

  const removeFromQueue = async () => {
    try {
      console.log("Home: Removing player from matchmaking queue");

      const response = await fetch("/api/matchmaking/remove", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Home: Remove from queue response:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log("Home: Remove from queue failed:", errorData);
        return false;
      }

      const data = await response.json();
      console.log("Home: Successfully removed from queue:", data);
      return true;
    } catch (error) {
      console.log("Home: Error removing from queue:", error);
      return false;
    }
  };

  const loadOpponentData = async (token: string) => {
    try {
      console.log("Home: Loading opponent data for token:", token);

      const response = await fetch("/api/users/by-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: token }),
      });

      if (response.ok) {
        const opponentData = await response.json();
        console.log("Home: Opponent data loaded:", opponentData);

        setOpponent(opponentData);
        return true;
      } else {
        console.log("Home: Failed to load opponent data:", response.status);
        return false;
      }
    } catch (error) {
      console.log("Home: Error loading opponent data:", error);
      return false;
    }
  };

  const loadBotData = async () => {
    try {
      console.log("Home: Loading bot data from /getBotInfo");

      const response = await fetch("/api/users/bot", {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const botData = await response.json();
        console.log("Home: Bot data loaded:", botData);

        // Create opponent object with bot data
        const botOpponent = {
          ...botData,
          token: "BOT", // Bot token
          rank: 0, // Bots don't have ranks
          winrate:
            botData.games_played > 0
              ? Math.round((botData.games_won / botData.games_played) * 100)
              : 0,
        };

        setOpponent(botOpponent);
        return true;
      } else {
        console.log("Home: Failed to load bot data:", response.status);
        return false;
      }
    } catch (error) {
      console.log("Home: Error loading bot data:", error);
      return false;
    }
  };

  const handleStartGame = async () => {
    if (!isAuthenticated) {
      navigateWithAnimationSideways("/login");
      return;
    }

    // If currently searching, cancel the search
    if (gameState === "searching") {
      console.log("Home: Cancelling matchmaking search");
      stopMatchmakingPolling();

      // Remove player from matchmaking queue
      await removeFromQueue();

      setGameState("idle");
      return;
    }

    try {
      console.log("Home: Starting matchmaking process");
      setGameState("searching");

      pollCountRef.current = 0;

      const response = await fetch("/api/matchmaking/queue", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Home: Matchmaking response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log("Home: Matchmaking failed:", errorData);
        setGameState("idle");
        // TODO: Show error message to user
        return;
      }

      const data = await response.json();
      console.log("Home: Successfully joined queue:", data);

      // Start polling for match status every 3 seconds
      startMatchmakingPolling();
    } catch (error) {
      console.log("Home: Error during matchmaking:", error);
      setGameState("idle");
      // TODO: Show error message to user
    }
  };

  // Return public interface
  return {
    handleStartGame,
    gameState,
    isSearching: gameState === "searching",
    isFound: gameState === "found",
  };
}
