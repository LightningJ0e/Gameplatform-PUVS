"use client";

import Card from "@/components/Card";
import BackgroundGlow from "@/components/BackgroundGlow";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<
    "rock" | "paper" | "scissors" | null
  >(null);

  return (
    <div className="h-full bg-slate-900 relative overflow-hidden">
      <BackgroundGlow hoveredCard={hoveredCard} />
      <main className="flex flex-col items-center justify-center px-8 pt-16">
        <div className="text-center mb-4">
          <h1 className="text-6xl font-bold text-white mb-6">
            Rock Paper Scissors
          </h1>
          <p className="text-3xl text-gray-400">
            Be careful not to cut yourself.
          </p>
        </div>
        <Link
          href="/game"
          className="px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-500 text-white text-xl m-4"
        >
          Start Game
        </Link>

        <div className="absolute bottom-0 left-0 right-0 h-2/5 overflow-hidden pt-20">
          <div className="relative flex justify-center">
            <div className="translate-y-24 overflow-visible z-10">
              <Card type="rock" size="xxlarge" onHover={setHoveredCard} />
            </div>
            <div className="translate-y-4 -ml-16 z-20">
              <Card type="scissors" size="xxlarge" onHover={setHoveredCard} />
            </div>
            <div className="-translate-y-16 -ml-20 z-30">
              <Card type="paper" size="xxlarge" onHover={setHoveredCard} />
            </div>
            <div className="translate-y-4 -ml-16 z-20">
              <Card type="rock" size="xxlarge" onHover={setHoveredCard} />
            </div>
            <div className="translate-y-22 -ml-12 z-10">
              <Card type="scissors" size="xxlarge" onHover={setHoveredCard} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
