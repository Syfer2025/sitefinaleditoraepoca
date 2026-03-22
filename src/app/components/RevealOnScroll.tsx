import { useRef, useEffect, type ReactNode, type CSSProperties } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

interface RevealOnScrollProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
  amount?: number;
}

const translateMap: Record<Direction, string> = {
  up: "translateY(40px)",
  down: "translateY(-40px)",
  left: "translateX(40px)",
  right: "translateX(-40px)",
  none: "none",
};

export function RevealOnScroll({
  children,
  direction = "up",
  delay = 0,
  duration = 0.7,
  className,
  once = true,
  amount = 0.2,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "none";
          if (once) observer.unobserve(el);
        }
      },
      { threshold: amount },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once, amount]);

  const style: CSSProperties = {
    opacity: 0,
    transform: translateMap[direction],
    transition: `opacity ${duration}s cubic-bezier(0.25,0.1,0.25,1) ${delay}s, transform ${duration}s cubic-bezier(0.25,0.1,0.25,1) ${delay}s`,
    willChange: "opacity, transform",
  };

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
