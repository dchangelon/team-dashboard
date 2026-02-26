import { getProgressStrokeColor } from "@/lib/constants";

interface ProgressRingProps {
  value: number; // 0-100
  size?: number; // px
  strokeWidth?: number; // px
  className?: string;
}

export function ProgressRing({
  value,
  size = 56,
  strokeWidth = 5,
  className = "",
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const colorClass = getProgressStrokeColor(value);

  return (
    <svg
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      aria-label={`${value}% complete`}
    >
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        className="text-gray-200"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        className={colorClass}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
      {/* Center text */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy="0.35em"
        className="fill-gray-900 text-xs font-semibold"
      >
        {value}%
      </text>
    </svg>
  );
}
