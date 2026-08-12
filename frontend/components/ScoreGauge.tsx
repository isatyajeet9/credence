"use client";

import { useEffect, useState } from "react";

type ScoreGaugeProps = {
  value: number;
  toneClass: string;
  label: string;
  sublabel?: string;
  qualifier?: string;
};

export default function ScoreGauge({ value, toneClass, label, sublabel, qualifier }: ScoreGaugeProps) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimated(value));
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const fillClass = toneClass.replace("text-", "bg-");
  const softBgClass = `${fillClass}-soft`;

  return (
    <div className="flex min-w-[150px] flex-col gap-2">
      <p className="kicker">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        <p className={`font-serif text-4xl leading-none font-semibold ${toneClass}`}>{Math.round(animated)}%</p>
        {qualifier && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${softBgClass} ${toneClass}`}>
            {qualifier}
          </span>
        )}
      </div>
      <div className="relative h-[3px] w-full overflow-hidden bg-line">
        <div
          className={`absolute inset-y-0 left-0 ${fillClass} transition-[width] duration-700 ease-out`}
          style={{ width: `${animated}%` }}
        />
      </div>
      {sublabel && <p className="text-xs text-ink-faint">{sublabel}</p>}
    </div>
  );
}
