import React from 'react';

interface CircularSpinnerProps {
  size?: number;
  strokeWidth?: number;
}

export const CircularSpinner: React.FC<CircularSpinnerProps> = ({
  size = 120,
  strokeWidth = 4,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // We want the gap to be roughly 25% of the circle
  const dashArray = circumference;
  const dashOffset = circumference * 0.25;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{width: size, height: size}}
    >
      {/* Outer Glow/Container Ring - Static */}
      <div
        className="absolute rounded-full border border-primary/10"
        style={{
          width: size + 30,
          height: size + 30,
        }}
      />

      {/* SVG Spinner */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="animate-spin-slow -rotate-90 transform"
      >
        {/* Background Track (Lighter Blue) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-primary/10"
        />

        {/* Progress Arc (Darker Blue) */}
        {/* We use stroke-dasharray to create the open circle look */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
          className="text-primary"
        />
      </svg>
    </div>
  );
};
