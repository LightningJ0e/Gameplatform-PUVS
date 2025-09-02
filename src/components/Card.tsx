import Image from "next/image";

interface CardProps {
  type: "rock" | "paper" | "scissors";
  size?: "small" | "medium" | "large" | "xlarge" | "xxlarge";
  isSelected?: boolean;
  onClick?: () => void;
}

export default function Card({
  type,
  size = "medium",
  isSelected,
  onClick,
}: CardProps) {
  // Karten-Konfiguration basierend auf deinem Design
  const cardConfig = {
    scissors: {
      gradient:
        "bg-gradient-to-bl from-purple-950 via-purple-400 to-purple-950",
      image: "/scissors.png",
      shadow: "shadow-purple-500/50",
    },
    rock: {
      gradient: "bg-gradient-to-bl from-blue-950 via-blue-400 to-blue-950",
      image: "/rock.png",
      shadow: "shadow-blue-500/50",
    },
    paper: {
      gradient: "bg-gradient-to-bl from-gray-600 via-gray-200 to-gray-600",
      image: "/paper.png",
      shadow: "shadow-gray-500/50",
    },
  };

  const sizeClasses = {
    small: "w-20 h-28 text-lg",
    medium: "w-32 h-44 text-2xl",
    large: "w-40 h-56 text-3xl",
    xlarge: "w-48 h-64 text-4xl",
    xxlarge: "w-64 h-88 text-5xl",
  };

  const config = cardConfig[type];

  return (
    <div
      className={`
          ${config.gradient}
          ${sizeClasses[size]}
          ${config.shadow}
          ${isSelected ? "ring-4 ring-yellow-400 scale-105" : ""}
          rounded-xl p-4 cursor-pointer transition-all duration-300
          hover:scale-105 hover:shadow-2xl
          relative overflow-hidden
        `}
      onClick={onClick}
    >
      {/* Glossy Overlay Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl" />

      {/* Inner Border */}
      <div className="absolute inset-4 border-2 border-black/20" />

      {/* Icon Container */}
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
  );
}
