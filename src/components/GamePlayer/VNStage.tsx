import React from 'react';

interface VNStageProps {
  backgroundLabel?: string;
}

export function VNStage({ backgroundLabel = 'Scene' }: VNStageProps) {
  return (
    <div className="relative flex-1 bg-gradient-to-b from-[#10102a] via-[#0b0b16] to-[#08080f]">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_#3b3b6d,_transparent_55%)]" />
      <div className="relative h-full w-full flex items-end justify-between px-6 pb-28">
        <div className="flex flex-col items-center text-xs text-gray-500">
          <div className="h-40 w-24 rounded-2xl border border-dashed border-[#2a2a3e]" />
          <span className="mt-2">Left</span>
        </div>
        <div className="flex flex-col items-center text-xs text-gray-500">
          <div className="h-52 w-32 rounded-3xl border border-dashed border-[#2a2a3e]" />
          <span className="mt-2">Center</span>
        </div>
        <div className="flex flex-col items-center text-xs text-gray-500">
          <div className="h-40 w-24 rounded-2xl border border-dashed border-[#2a2a3e]" />
          <span className="mt-2">Right</span>
        </div>
      </div>
      <div className="absolute left-6 top-6 text-xs uppercase tracking-[0.3em] text-gray-500">
        {backgroundLabel}
      </div>
    </div>
  );
}
