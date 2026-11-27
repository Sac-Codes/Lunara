import React from 'react';
import { Cloud, CloudRain, CloudSun, Compass, Moon, Sun } from 'lucide-react';
import type { MoodId } from '../../types/lunara';

export const LunaraMark: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="12" className="fill-[#293B56] dark:fill-[#352942]" />
      <path
        d="M24.2 11.4C22.7 10.9 21.1 10.8 19.5 11.2C14.9 12.3 12 17 13.1 21.6C14.2 26.2 18.9 29.1 23.5 28C25.1 27.6 26.5 26.8 27.6 25.6C25.2 26.3 22.6 25.7 20.7 23.9C18.1 21.3 18.1 17 20.7 14.4C21.8 13.4 23 12.7 24.2 11.4Z"
        fill="#EAE0F3"
      />
      <circle cx="26.5" cy="15.2" r="1.4" fill="#E5B26F" />
      <path
        d="M11 30.2C15.2 28 19.8 27.9 24.5 29.3C26.7 30 28.1 30 29.5 29.4"
        stroke="#76BBAA"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeOpacity="0.85"
      />
    </svg>
  );
};

export const MoodIcon: React.FC<{ mood: MoodId; className?: string }> = ({
  mood,
  className = 'w-5 h-5',
}) => {
  switch (mood) {
    case 'great':
      return <Sun className={className} strokeWidth={1.85} aria-hidden="true" />;
    case 'good':
      return <CloudSun className={className} strokeWidth={1.85} aria-hidden="true" />;
    case 'okay':
      return <Moon className={className} strokeWidth={1.85} aria-hidden="true" />;
    case 'low':
      return <Cloud className={className} strokeWidth={1.85} aria-hidden="true" />;
    case 'difficult':
      return <CloudRain className={className} strokeWidth={1.85} aria-hidden="true" />;
    case 'unsure':
      return <Compass className={className} strokeWidth={1.85} aria-hidden="true" />;
  }
};
