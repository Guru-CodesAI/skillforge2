import React from 'react';
import { motion } from 'framer-motion';

interface ScoreRingProps {
  score: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
  animate?: boolean;
}

export default function ScoreRing({
  score,
  max = 10,
  size = 120,
  strokeWidth = 8,
  color = '#00D4FF',
  label,
  sublabel,
  animate: shouldAnimate = true,
}: ScoreRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(score / max, 1);
  const offset = circumference * (1 - percentage);

  const getColor = () => {
    if (score >= 8) return '#00D4FF';
    if (score >= 6) return '#00FFF7';
    if (score >= 4) return '#8B5CF6';
    return '#FF4DFF';
  };

  const ringColor = color || getColor();
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Animated progress ring */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={shouldAnimate ? { strokeDashoffset: circumference } : undefined}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
            style={{
              filter: `drop-shadow(0 0 8px ${ringColor}80)`,
            }}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-2xl font-bold text-white"
            initial={shouldAnimate ? { opacity: 0, scale: 0.5 } : undefined}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {score.toFixed(1)}
          </motion.span>
          {max !== 10 && (
            <span className="text-xs text-white/40">/{max}</span>
          )}
        </div>
      </div>

      {label && (
        <div className="text-center">
          <p className="text-sm font-semibold text-white">{label}</p>
          {sublabel && <p className="text-xs text-white/40">{sublabel}</p>}
        </div>
      )}
    </div>
  );
}
