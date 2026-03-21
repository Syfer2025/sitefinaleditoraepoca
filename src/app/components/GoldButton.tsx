import React, { useMemo } from "react";
import { Link } from "react-router";

interface GoldButtonProps {
  children: React.ReactNode;
  href?: string;
  to?: string;
  target?: string;
  type?: "button" | "submit";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function GoldButton({
  children,
  href,
  to,
  target,
  type = "button",
  className = "",
  onClick,
  disabled = false,
}: GoldButtonProps) {
  const delay = useMemo(() => Math.random() * -10, []);

  const baseClasses = `
    relative overflow-hidden
    rounded-full
    text-[#1a1206]
    shadow-[0_2px_12px_rgba(0,0,0,0.25)]
    hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]
    transition-all duration-300
    cursor-pointer
    disabled:opacity-60 disabled:cursor-not-allowed
    ${className}
  `.trim();

  const bgStyle: React.CSSProperties = {
    background:
      "linear-gradient(90deg, #8B6914 0%, #BF953F 12%, #D4AF5A 25%, #E8CC73 40%, #F5DFA0 50%, #E8CC73 60%, #D4AF5A 75%, #BF953F 88%, #8B6914 100%)",
    fontFamily: "Inter, sans-serif",
  };

  const shimmer = (
    <span
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.25) 55%, transparent 65%)",
        backgroundSize: "250% 100%",
        animation: `goldShimmer 10s linear ${delay}s infinite`,
      }}
    />
  );

  // Uses the global #goldNoise filter rendered once in RootLayout
  const noise = (
    <span
      className="absolute inset-0 pointer-events-none rounded-full"
      style={{
        filter: "url(#goldNoise)",
        opacity: 0.2,
        mixBlendMode: "overlay",
      }}
    />
  );

  if (to) {
    return (
      <Link to={to} className={`block ${baseClasses}`} style={bgStyle} onClick={onClick}>
        {noise}
        {shimmer}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined} className={`block ${baseClasses}`} style={bgStyle} onClick={onClick}>
        {noise}
        {shimmer}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </a>
    );
  }

  return (
    <button type={type} className={baseClasses} style={bgStyle} onClick={onClick} disabled={disabled}>
      {noise}
      {shimmer}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}
