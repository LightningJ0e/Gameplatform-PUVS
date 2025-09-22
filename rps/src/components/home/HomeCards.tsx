import Card from "@/components/ui/Card";

export default function HomeCards({
  showRanking,
  animateCards,
  setHoveredCard,
}: {
  showRanking: boolean;
  animateCards: boolean;
  setHoveredCard: (card: "rock" | "paper" | "scissors" | null) => void;
}) {
  return (
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
  );
}
