import Image from "next/image";

interface CardProps {
  type: "rock" | "paper" | "scissors";
  size?: "small" | "medium" | "large" | "xlarge" | "xxlarge";
  isSelected?: boolean;
  isFlipped?: boolean; // true = Vorderseite, false = Rückseite
  onClick?: () => void;
  onHover?: (type: "rock" | "paper" | "scissors" | null) => void;
  isInteractive?: boolean; // false = keine Hover/Click-Effekte
}

export default function Card({
  type,
  size = "medium",
  isSelected,
  isFlipped = true,
  onClick,
  onHover,
  isInteractive = true,
}: CardProps) {
  // Karten-Konfiguration basierend auf deinem Design
  const cardConfig = {
    scissors: {
      gradient:
        "bg-gradient-to-bl from-purple-950 via-purple-400 to-purple-950",
      image: "/scissors.png",
      shadow: "shadow-purple-500/50",
      hoverShadow: "hover:shadow-purple-400/40",
      selectedRing: "ring-purple-400",
      selectedShadow: "shadow-purple-400/60",
    },
    rock: {
      gradient: "bg-gradient-to-bl from-blue-950  via-blue-400 to-blue-950",
      image: "/rock.png",
      shadow: "shadow-blue-500/50",
      hoverShadow: "hover:shadow-blue-400/40",
      selectedRing: "ring-blue-400",
      selectedShadow: "shadow-blue-400/60",
    },
    paper: {
      gradient: "bg-gradient-to-bl from-gray-600 via-gray-200 to-gray-600",
      image: "/paper.png",
      shadow: "shadow-gray-500/50",
      hoverShadow: "hover:shadow-gray-300/40",
      selectedRing: "ring-gray-300",
      selectedShadow: "shadow-gray-300/60",
    },
  };

  const sizeClasses = {
    small: "w-28 h-38 text-lg",
    medium: "w-32 h-44 text-2xl",
    large: "w-40 h-56 text-3xl",
    xlarge: "w-48 h-64 text-4xl",
    xxlarge: "w-64 h-88 text-5xl",
  };

  const config = cardConfig[type];

  // Rückseiten-Design
  const cardBackDesign = {
    gradient: "33417A",
    shadow: "shadow-amber-500/50",
  };

  return (
    <div
      className={`
          ${sizeClasses[size]}
          ${
            isSelected && isInteractive
              ? `ring-4 ${config.selectedRing} scale-105 shadow-2xl ${config.selectedShadow}`
              : ""
          }
          ${isInteractive ? "cursor-pointer" : ""}
          transition-all duration-500
          ${
            isInteractive
              ? `hover:scale-105 hover:shadow-2xl ${config.hoverShadow}`
              : ""
          }
          relative preserve-3d rounded-xl
          ${isFlipped ? "" : "rotate-y-180"}
        `}
      onClick={isInteractive ? onClick : undefined}
      onMouseEnter={isInteractive ? () => onHover?.(type) : undefined}
      onMouseLeave={isInteractive ? () => onHover?.(null) : undefined}
      style={{
        transformStyle: "preserve-3d",
        transform: isFlipped ? "rotateY(0deg)" : "rotateY(180deg)",
      }}
    >
      {/* Vorderseite */}
      <div
        className={`
          ${config.gradient}
          ${config.shadow}
          absolute inset-0 rounded-xl p-4 overflow-hidden
          backface-hidden
        `}
        style={{ backfaceVisibility: "hidden" }}
      >
        {/* Glossy Overlay Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl" />

        {/* Inner Border */}
        <div
          className={
            size === "xxlarge"
              ? "absolute inset-8 border-3 border-black/20"
              : "absolute inset-4 border-2 border-black/20"
          }
        >
          <div className="relative z-10 h-full">
            {/* Icon oben rechts */}
            <div className="absolute top-4 right-4">
              <Image
                src={config.image}
                alt={type}
                width={
                  size === "large"
                    ? 65
                    : size === "xlarge"
                    ? 75
                    : size === "xxlarge"
                    ? 95
                    : type === "rock"
                    ? 45
                    : 40
                }
                height={
                  size === "large"
                    ? 65
                    : size === "xlarge"
                    ? 75
                    : size === "xxlarge"
                    ? 95
                    : type === "rock"
                    ? 45
                    : 40
                }
                className={
                  type === "scissors"
                    ? "drop-shadow-lg rotate-320"
                    : "drop-shadow-lg rotate-50"
                }
              />
            </div>

            <div className="absolute bottom-4 left-4">
              <Image
                src={config.image}
                alt={type}
                width={
                  size === "large"
                    ? 65
                    : size === "xlarge"
                    ? 75
                    : size === "xxlarge"
                    ? 95
                    : type === "rock"
                    ? 45
                    : 40
                }
                height={
                  size === "large"
                    ? 65
                    : size === "xlarge"
                    ? 75
                    : size === "xxlarge"
                    ? 95
                    : type === "rock"
                    ? 45
                    : 40
                }
                className={
                  type === "scissors"
                    ? "drop-shadow-lg rotate-140"
                    : "drop-shadow-lg rotate-240"
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Rückseite */}
      <div
        className={`
          ${cardBackDesign.gradient}
          ${cardBackDesign.shadow}
          absolute inset-0 rounded-xl p-4 overflow-hidden
          backface-hidden rotate-y-180 border-2 border-amber-400
        `}
        style={{
          backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
        }}
      >
        {/* Oberes linkes Schnörkel-Bild */}
        <div className="absolute top-0.5 left-0.5 w-14 h-14">
          <Image
            src="/Schnörkelidu.png"
            alt="Card Back Top Left"
            fill
            className="object-contain scale-y-[-1] scale-x-[-1]"
          />
        </div>

        {/* Oberes rechtes Schnörkel-Bild */}
        <div className="absolute bottom-0.5 right-0.5 w-14 h-14">
          <Image
            src="/Schnörkelidu.png"
            alt="Card Back Top Right"
            fill
            className="object-contain "
          />
        </div>

        {/* Glossy Overlay Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-xl" />

        {/* Rückseiten-Muster */}
        <div
          className={`
            ${
              size === "xxlarge"
                ? "absolute inset-8 border-3 border-amber-400"
                : "absolute inset-7 border-1 my-1 border-amber-400"
            }
          `}
        >
          <Image
            src="/LogoGold.png"
            alt="Card Back"
            fill
            className="px-2 py-5"
          />
        </div>
      </div>
    </div>
  );
}
