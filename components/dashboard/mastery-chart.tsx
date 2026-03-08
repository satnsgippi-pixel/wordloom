"use client";

import { useEffect, useRef } from "react";
import { Chart, type ChartConfiguration } from "chart.js/auto";

const TARGET_TOTAL = 10_000;

interface MasteryChartProps {
  mastered: number;
  inProgress: number;
}

export function MasteryChart({ mastered, inProgress }: MasteryChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart<"doughnut"> | null>(null);

  const remaining = Math.max(0, TARGET_TOTAL - mastered - inProgress);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const config: ChartConfiguration<"doughnut"> = {
      type: "doughnut",
      data: {
        labels: ["Mastered", "In Progress", "Remaining"],
        datasets: [
          {
            data: [mastered, inProgress, remaining],
            backgroundColor: ["#4338ca", "#93c5fd", "#e2e8f0"],
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "78%",
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(30, 41, 59, 0.9)",
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => {
                const label = ctx.label || "";
                const value = ctx.parsed ?? 0;
                return `${label}: ${new Intl.NumberFormat("en-US").format(value)} words`;
              },
            },
          },
        },
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 800,
        },
      },
    };

    chartRef.current = new Chart(ctx, config);

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [mastered, inProgress, remaining]);

  return (
    <div className="relative w-full max-w-[320px] h-[320px] mx-auto flex items-center justify-center">
      <canvas ref={canvasRef} />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-black text-slate-800 tracking-tight">
          10,000
        </span>
        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">
          Total Target
        </span>
      </div>
    </div>
  );
}
