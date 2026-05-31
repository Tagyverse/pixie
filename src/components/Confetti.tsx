import { useEffect, useState } from 'react';

interface ConfettiProps {
  isActive: boolean;
  originX?: number;
  originY?: number;
  onComplete?: () => void;
}

export default function Confetti({ isActive, originX, originY, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; angle: number; speed: number; size: number; color: string; rotation: number }>>([]);

  useEffect(() => {
    if (isActive) {
      const colors = ['#1B365D', '#C9A96E', '#F4C2C2', '#2C4A7C', '#D4AF37', '#FADADD', '#0F2440', '#E8C87A'];
      const cx = originX ?? 50;
      const cy = originY ?? 50;
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: cx,
        y: cy,
        angle: (Math.random() * 360) * (Math.PI / 180),
        speed: 2 + Math.random() * 4,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [isActive, originX, originY, onComplete]);

  if (!isActive || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-confetti-burst"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${particle.rotation}deg)`,
            '--burst-x': `${Math.cos(particle.angle) * particle.speed * 40}px`,
            '--burst-y': `${Math.sin(particle.angle) * particle.speed * 40 - 60}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
