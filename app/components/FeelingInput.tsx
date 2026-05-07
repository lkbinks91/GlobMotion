"use client";

interface FeelingInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function FeelingInput({ value, onChange }: FeelingInputProps) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Je me sens stressé, fatigué, curieux..."
      className="
        w-80 px-4 py-3 rounded-full
        bg-white/10 backdrop-blur
        text-white placeholder-white/60
        outline-none
      "
    />
  );
}
