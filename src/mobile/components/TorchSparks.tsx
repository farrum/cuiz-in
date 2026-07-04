import React from 'react';

export function TorchSparks({ count = 6 }: { count?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {Array.from({ length: count }).map((_, i) => {
        const delay = `${(i * 0.4).toFixed(1)}s`;
        const left = `${20 + Math.random() * 60}%`;
        const driftX = `${(Math.random() * 30 - 15).toFixed(0)}px`;
        return (
          <div
            key={i}
            className="torch-spark"
            style={{
              left,
              bottom: '20px',
              animationDelay: delay,
              // @ts-ignore
              '--drift-x': driftX,
            }}
          />
        );
      })}
    </div>
  );
}
