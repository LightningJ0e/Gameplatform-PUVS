"use client";

import Card from "@/components/Card";
import BackgroundGlow from "@/components/BackgroundGlow";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Ranking from "@/components/Ranking";
import PlayerProfile from "@/components/PlayerProfile";
import Settings from "@/components/Settings";
import SettingsButton from "@/components/SettingsButton";

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<
    "rock" | "paper" | "scissors" | null
  >(null);
  const [pageClass, setPageClass] = useState("page-slide-in-from-bottom");
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [showRanking, setShowRanking] = useState(false);
  const [animateCards, setAnimateCards] = useState(false);
  const [gameState, setGameState] = useState<"idle" | "searching" | "found">(
    "idle"
  );
  const [showSettings, setShowSettings] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [username, setUsername] = useState("Player");

  // Load saved profile data from localStorage
  useEffect(() => {
    const savedImage = localStorage.getItem("profileImage");
    const savedUsername = localStorage.getItem("username");

    console.log("Loading profile data:", {
      savedImage: !!savedImage,
      savedUsername,
    });

    if (savedImage) {
      setProfileImage(savedImage);
    }
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  // Function to refresh profile data after settings change
  const refreshProfileData = () => {
    const savedImage = localStorage.getItem("profileImage");
    const savedUsername = localStorage.getItem("username");

    console.log("Refreshing profile data:", {
      savedImage: !!savedImage,
      savedUsername,
    });

    setProfileImage(savedImage);
    setUsername(savedUsername || user?.username || "Player");
  };
  const { user } = useAuth();

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

  const handleStartGame = () => {
    if (isAuthenticated) {
      setGameState("searching");
      setTimeout(() => {
        setGameState("found");

        setTimeout(() => {
          navigateWithAnimationOutUp("/game");
        }, 700);
      }, 3000);
    } else {
      navigateWithAnimationSideways("/login");
    }
  };

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
          {isAuthenticated && (
            <div className="absolute top-32 left-16 flex items-start space-x-4">
              <PlayerProfile
                username={username || user?.username || "Player"}
                profileImage={profileImage || undefined}
                position="relative"
                rankingPosition={2}
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
          <button
            onClick={handleStartGame}
            className="px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-500 text-white text-xl m-4"
            disabled={gameState === "searching"}
          >
            {gameState === "searching"
              ? "Searching..."
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
        </main>
      )}

      {showRanking && <Ranking setShowRanking={setShowRanking} />}

      {showSettings && (
        <Settings
          setShowSettings={setShowSettings}
          onSave={refreshProfileData}
        />
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 h-2/5 overflow-visible pt-20 transition-all duration-700 ${
          showRanking
            ? "translate-x-160 translate-y-10"
            : animateCards
            ? "-translate-y-20"
            : "translate-y-10"
        }`}
      >
        <div className="relative flex justify-center">
          <div
            className={` overflow-visible z-10 transition-all duration-700 ${
              showRanking
                ? "translate-x-90 translate-y-24"
                : animateCards
                ? "-translate-y-40"
                : "translate-y-24"
            }`}
          >
            <Card type="rock" size="xxlarge" onHover={setHoveredCard} />
          </div>
          <div
            className={` -ml-16 z-20 transition-all duration-700 ${
              showRanking
                ? "translate-y-10 translate-x-70"
                : animateCards
                ? "-translate-y-20"
                : "translate-y-4"
            }`}
          >
            <Card type="scissors" size="xxlarge" onHover={setHoveredCard} />
          </div>
          <div
            className={` -ml-20 z-30 transition-all duration-700 ${
              showRanking
                ? "translate-x-60 -translate-y-10"
                : animateCards
                ? "-translate-y-0"
                : "-translate-y-16"
            }`}
          >
            <Card type="paper" size="xxlarge" onHover={setHoveredCard} />
          </div>
          <div
            className={`-ml-16 z-20 transition-all duration-700 ${
              showRanking
                ? "-translate-y-50 translate-x-30"
                : animateCards
                ? "-translate-y-20"
                : "translate-y-4 "
            }`}
          >
            <Card type="rock" size="xxlarge" onHover={setHoveredCard} />
          </div>
          <div
            className={`-ml-12 z-10 transition-all duration-700 ${
              showRanking
                ? "-translate-y-80"
                : animateCards
                ? "-translate-y-40"
                : "translate-y-22"
            }`}
          >
            <Card type="scissors" size="xxlarge" onHover={setHoveredCard} />
          </div>
        </div>
      </div>
    </div>
  );
}
