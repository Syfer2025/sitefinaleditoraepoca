interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 40, className = "" }: LoadingSpinnerProps) {
  return (
    <div
      className={`rounded-full animate-spin ${className}`}
      style={{
        width: size,
        height: size,
        border: `${Math.max(2, size / 12)}px solid rgba(22,91,54,0.2)`,
        borderTopColor: "#165B36",
      }}
      role="status"
      aria-label="Carregando..."
    />
  );
}
