import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  value: number; // 0.0 to 5.0
  onChange?: (val: number) => void;
  size?: number;
  interactive?: boolean;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  value,
  onChange,
  size = 18,
  interactive = false,
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue !== null ? hoverValue : value;

  const handleMouseMove = (starIndex: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !onChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isHalf = x < rect.width / 2;
    setHoverValue(starIndex + (isHalf ? 0.5 : 1.0));
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setHoverValue(null);
  };

  const handleClick = (starIndex: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !onChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isHalf = x < rect.width / 2;
    const finalVal = starIndex + (isHalf ? 0.5 : 1.0);
    // If clicking same value again, can toggle or set
    onChange(finalVal);
  };

  return (
    <div
      className="rating-star-container"
      onMouseLeave={handleMouseLeave}
      title={displayValue > 0 ? `${displayValue.toFixed(1)} Stars` : 'Rate'}
    >
      {[0, 1, 2, 3, 4].map((starIndex) => {
        const starScore = displayValue - starIndex;
        const isFull = starScore >= 1.0;
        const isHalf = starScore >= 0.5 && starScore < 1.0;

        return (
          <div
            key={starIndex}
            className={interactive ? 'star-interactive' : ''}
            onMouseMove={(e) => handleMouseMove(starIndex, e)}
            onClick={(e) => handleClick(starIndex, e)}
            style={{ position: 'relative', width: size, height: size }}
          >
            {/* Background empty star */}
            <Star
              size={size}
              stroke="var(--border-focus)"
              fill="rgba(255, 255, 255, 0.05)"
              strokeWidth={1.5}
            />

            {/* Filled / Half star overlay */}
            {(isFull || isHalf) && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: isFull ? '100%' : '50%',
                  height: '100%',
                  overflow: 'hidden',
                }}
              >
                <Star
                  size={size}
                  stroke="var(--accent-gold)"
                  fill="var(--accent-gold)"
                  strokeWidth={1.5}
                />
              </div>
            )}
          </div>
        );
      })}
      {displayValue > 0 && (
        <span style={{ fontSize: size * 0.75, fontWeight: 700, color: 'var(--accent-gold)', marginLeft: 4 }}>
          {displayValue.toFixed(1)}
        </span>
      )}
    </div>
  );
};
