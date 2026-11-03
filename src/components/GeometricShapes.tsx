import React from 'react';

export const BauhausCircle: React.FC<{
  size?: number;
  color?: string;
  borderColor?: string;
  className?: string;
  children?: React.ReactNode;
}> = ({ size = 24, color = '#D7263D', borderColor = '#111111', className = '', children }) => (
  <div
    style={{
      width: size,
      height: size,
      backgroundColor: color,
      borderColor: borderColor,
    }}
    className={`rounded-full border-2 flex items-center justify-center shrink-0 ${className}`}
  >
    {children}
  </div>
);

export const BauhausSquare: React.FC<{
  size?: number;
  color?: string;
  borderColor?: string;
  className?: string;
  children?: React.ReactNode;
}> = ({ size = 24, color = '#1E4CA1', borderColor = '#111111', className = '', children }) => (
  <div
    style={{
      width: size,
      height: size,
      backgroundColor: color,
      borderColor: borderColor,
    }}
    className={`border-2 flex items-center justify-center shrink-0 ${className}`}
  >
    {children}
  </div>
);

export const BauhausTriangle: React.FC<{
  size?: number;
  color?: string;
  borderColor?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}> = ({ size = 24, color = '#F4B400', borderColor = '#111111', direction = 'up', className = '' }) => {
  const rotation = {
    up: '0deg',
    right: '90deg',
    down: '180deg',
    left: '270deg',
  }[direction];

  return (
    <div
      style={{
        width: size,
        height: size,
        transform: `rotate(${rotation})`,
      }}
      className={`shrink-0 flex items-center justify-center ${className}`}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" className="overflow-visible">
        <polygon
          points="50,10 92,88 8,88"
          fill={color}
          stroke={borderColor}
          strokeWidth="6"
          strokeLinejoin="miter"
        />
      </svg>
    </div>
  );
};

export const BauhausEmblem: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center gap-1.5 ${className}`}>
    {/* Circle: Red */}
    <div className="w-4 h-4 rounded-full bg-[#D7263D] border border-[#111111]" />
    {/* Square: Blue */}
    <div className="w-4 h-4 bg-[#1E4CA1] border border-[#111111]" />
    {/* Triangle: Yellow */}
    <div className="w-4 h-4 flex items-center justify-center">
      <svg width="16" height="16" viewBox="0 0 100 100">
        <polygon points="50,10 92,90 8,90" fill="#F4B400" stroke="#111111" strokeWidth="10" />
      </svg>
    </div>
  </div>
);
