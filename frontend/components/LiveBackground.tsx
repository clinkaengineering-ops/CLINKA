"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";

type ShapeType = "circle" | "triangle" | "square" | "cross";

interface Particle {
  x: number;
  y: number;
  z: number;
  color: string;
  size: number;
  speed: number;
  shape: ShapeType;
}

const COLORS = ["#196481", "#c97a51", "#fa6619", "#ffffff", "#ffffff"]; 
const SHAPES: ShapeType[] = ["circle", "circle", "circle", "triangle", "square", "cross"];

export function LiveBackground({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const sizeRef = useRef({ width: 0, height: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const resizeObserver = new ResizeObserver(() => {
      // Observe the canvas itself to prevent any layout feedback loops or parent box-model issues
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      if (width === 0 || height === 0) return;
      
      sizeRef.current = { width, height };
      canvas.width = width;
      canvas.height = height;
      
      if (particlesRef.current.length === 0) {
        initParticles(width, height);
      }
    });
    resizeObserver.observe(canvas);

    const initParticles = (w: number, h: number) => {
      const particleCount = Math.min(w, 700); 
      particlesRef.current = Array.from({ length: particleCount }).map(() => ({
        x: (Math.random() - 0.5) * w * 2,
        y: (Math.random() - 0.5) * h * 2,
        z: Math.random() * w,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 2 + 1, // Slightly larger to see shapes
        speed: Math.random() * 1.5 + 0.2, 
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)]
      }));
    };

    const handleMouseMove = (e: MouseEvent) => {
      const { width, height } = sizeRef.current;
      if (width === 0 || height === 0) return;
      mouseRef.current.targetX = (e.clientX - width / 2) / (width / 2);
      mouseRef.current.targetY = (e.clientY - height / 2) / (height / 2);
    };

    window.addEventListener("mousemove", handleMouseMove);

    const animate = () => {
      const { width, height } = sizeRef.current;
      if (width === 0 || height === 0) {
        requestRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      const centerX = width / 2 + mouseRef.current.x * (width * 0.1);
      const centerY = height / 2 + mouseRef.current.y * (height * 0.1);

      const projected: { x: number, y: number, color: string, opacity: number }[] = [];

      particlesRef.current.forEach((p) => {
        p.z -= p.speed;
        
        if (p.z <= 0) {
          p.z = width;
          p.x = (Math.random() - 0.5) * width * 2;
          p.y = (Math.random() - 0.5) * height * 2;
        }

        const ratio = width / p.z;
        const projectedX = centerX + p.x * ratio;
        const projectedY = centerY + p.y * ratio;
        const projectedSize = p.size * ratio;

        if (
          projectedX >= -50 &&
          projectedX <= width + 50 &&
          projectedY >= -50 &&
          projectedY <= height + 50
        ) {
          const opacity = Math.min(1, Math.max(0.1, 1 - p.z / width));
          
          ctx.beginPath();
          ctx.fillStyle = p.color;
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = opacity;
          
          if (p.shape === "circle") {
            ctx.arc(projectedX, projectedY, projectedSize, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.shape === "square") {
            ctx.rect(projectedX - projectedSize, projectedY - projectedSize, projectedSize * 2, projectedSize * 2);
            ctx.fill();
          } else if (p.shape === "triangle") {
            ctx.moveTo(projectedX, projectedY - projectedSize);
            ctx.lineTo(projectedX + projectedSize, projectedY + projectedSize);
            ctx.lineTo(projectedX - projectedSize, projectedY + projectedSize);
            ctx.closePath();
            ctx.fill();
          } else if (p.shape === "cross") {
            ctx.lineWidth = 1.5;
            ctx.moveTo(projectedX - projectedSize * 1.5, projectedY);
            ctx.lineTo(projectedX + projectedSize * 1.5, projectedY);
            ctx.moveTo(projectedX, projectedY - projectedSize * 1.5);
            ctx.lineTo(projectedX, projectedY + projectedSize * 1.5);
            ctx.stroke();
          }

          projected.push({ x: projectedX, y: projectedY, color: p.color, opacity });
        }
      });
      
      // Draw thread links
      ctx.lineWidth = 0.5;
      const maxDistance = 100;
      
      const connectLimit = Math.min(projected.length, 250);
      for (let i = 0; i < connectLimit; i++) {
        for (let j = i + 1; j < connectLimit; j++) {
          const p1 = projected[i];
          const p2 = projected[j];
          
          const dx = p1.x - p2.x;
          if (Math.abs(dx) > maxDistance) continue;
          
          const dy = p1.y - p2.y;
          if (Math.abs(dy) > maxDistance) continue;
          
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDistance) {
            const lineOpacity = (1 - dist / maxDistance) * 0.2 * p1.opacity;
            ctx.beginPath();
            ctx.strokeStyle = p1.color;
            ctx.globalAlpha = lineOpacity;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;

      requestRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();
      cancelAnimationFrame(requestRef.current);
    };
  }, [reducedMotion]);

  if (reducedMotion) {
    return (
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-teal/10 via-transparent to-brand-copper/5",
          className,
        )}
        aria-hidden="true"
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={cn("pointer-events-none absolute inset-0 block h-full w-full", className)}
      aria-hidden="true"
    />
  );
}
