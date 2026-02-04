import React from 'react';

interface EdgeIconProps {
  color?: string;
  size?: number;
  className?: string;
}

export function EdgeIcon({ color = 'currentColor', size = 24, className = '' }: EdgeIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="6" cy="12" r="2" fill={color} />
      <circle cx="18" cy="12" r="2" fill={color} />
      <line
        x1="8"
        y1="12"
        x2="16"
        y2="12"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
}





