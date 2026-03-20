import { motion, type Variant } from "motion/react";
import type { ReactNode } from "react";

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

const offsets: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 40 },
  down: { y: -40 },
  left: { x: 40 },
  right: { x: -40 },
  none: {},
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
  const offset = offsets[direction];

  const hidden: Variant = {
    opacity: 0,
    ...(offset.x !== undefined && { x: offset.x }),
    ...(offset.y !== undefined && { y: offset.y }),
  };

  const visible: Variant = {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      duration,
      delay,
      ease: [0.25, 0.1, 0.25, 1],
    },
  };

  return (
    <motion.div
      initial={hidden}
      whileInView={visible}
      viewport={{ once, amount }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
