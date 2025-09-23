"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/ui/Header";
import Ranking from "@/components/home/Ranking";
import PlayerProfile from "@/components/ui/PlayerProfile";
import Settings from "@/components/Settings";
import SettingsButton from "@/components/SettingsButton";
import HomeCards from "@/components/home/HomeCards";
import MatchmakingButton from "@/components/home/MatchmakingButton";
import { useMatchmaking } from "@/app/hooks/useMatchmaking";
export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<
    "rock" | "paper" | "scissors" | null
  >(null);
  const [pageClass, setPageClass] = useState("page-slide-in-from-bottom");
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const { handleStartGame, gameState, isFound } = useMatchmaking();
  const [showRanking, setShowRanking] = useState(false);
  const [animateCards, setAnimateCards] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Function to refresh profile data after settings change
  const refreshProfileData = () => {
    // Profile data now comes from AuthContext, no localStorage needed
  };

  const navigateWithAnimationOutUp = (href: string) => {
    setAnimateCards(true);
    setTimeout(() => {
      setPageClass("page-slide-out-up");
      setTimeout(() => {
        router.push(href);
      }, 500);
    }, 500);
  };

  const navigateWithAnimationSideways = (href: string) => {
    setPageClass("page-slide-out-right");
    setTimeout(() => {
      router.push(href);
    }, 500);
  };

  useEffect(() => {
    if (!isFound) return;
    navigateWithAnimationOutUp("/game");
  }, [isFound, navigateWithAnimationOutUp]);

  return (
    <div
      className={`h-full bg-slate-900 relative overflow-hidden ${pageClass}`}
    >
      <Header
        onNavigate={navigateWithAnimationSideways}
        setShowRanking={setShowRanking}
        showRanking={showRanking}
      />
      {!showRanking && (
        <main className="flex flex-col items-center justify-center px-8 pt-16">
          {isAuthenticated && user && (
            <div className="absolute top-32 left-16 flex items-start space-x-4">
              <PlayerProfile
                username={user.username || "Player"}
                profileImage={
                  user.picture
                    ? `data:image/png;base64,${user.picture}`
                    : undefined
                }
                position="relative"
                rankingPosition={user.rank}
                hearts={0}
              />
              <SettingsButton setShowSettings={setShowSettings} />
            </div>
          )}

          <div className="text-center mb-4">
            <h1 className="text-6xl font-bold text-white mb-6">
              Rock Paper Scissors
            </h1>
            <p className="text-3xl text-gray-400">
              Be careful not to cut yourself.
            </p>
          </div>
          <MatchmakingButton
            handleStartGame={handleStartGame}
            gameState={gameState}
          />
        </main>
      )}

      {showRanking && <Ranking setShowRanking={setShowRanking} />}

      {showSettings && (
        <Settings
          setShowSettings={setShowSettings}
          onSave={refreshProfileData}
        />
      )}
      <HomeCards
        showRanking={showRanking}
        animateCards={animateCards}
        setHoveredCard={setHoveredCard}
      />
    </div>
  );
}
