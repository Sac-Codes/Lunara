import React from 'react';

export const TwilightMoonIllustration: React.FC<{ className?: string }> = ({
  className = 'w-full h-full',
}) => {
  return (
    <svg
      viewBox="0 0 560 440"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="skyWash" x1="60" y1="20" x2="480" y2="380" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#78A6E7" stopOpacity="0.28" />
          <stop offset="52%" stopColor="#B18ACD" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#D99EBB" stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id="crescentFill" x1="220" y1="80" x2="350" y2="230" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EAE0F3" />
          <stop offset="55%" stopColor="#D5BCE8" />
          <stop offset="100%" stopColor="#78A6E7" />
        </linearGradient>
        <linearGradient id="hillBack" x1="0" y1="250" x2="560" y2="420" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#78A6E7" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#304A70" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="hillMid" x1="40" y1="280" x2="540" y2="440" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#B18ACD" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#795D96" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="hillFront" x1="0" y1="330" x2="560" y2="440" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#76BBAA" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#263D3A" stopOpacity="0.58" />
        </linearGradient>
      </defs>

      {/* Soft orbital sky halo */}
      <circle cx="280" cy="175" r="145" fill="url(#skyWash)" />
      <circle
        cx="280"
        cy="175"
        r="112"
        stroke="#EAE0F3"
        strokeOpacity="0.24"
        strokeWidth="1"
        strokeDasharray="4 6"
      />

      {/* Constellation dots and fine lines */}
      <path
        d="M128 118L168 92L204 126"
        stroke="#B9D3F4"
        strokeOpacity="0.45"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="128" cy="118" r="2.8" fill="#E5B26F" />
      <circle cx="168" cy="92" r="2" fill="#EAE0F3" />
      <circle cx="204" cy="126" r="2.5" fill="#76BBAA" />

      <path
        d="M368 96L416 114L444 82"
        stroke="#F0C7DA"
        strokeOpacity="0.45"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="368" cy="96" r="2.5" fill="#F3D8A9" />
      <circle cx="416" cy="114" r="3" fill="#D99EBB" />
      <circle cx="444" cy="82" r="2" fill="#B9D3F4" />

      {/* Crescent Moon */}
      <path
        d="M312 102C298.5 97.4 283.8 96.5 269 100C226.4 110.2 200.2 153 210.4 195.6C220.6 238.2 263.4 264.4 306 254.2C320.8 250.7 333.7 243.1 343.9 232.8C321.8 239 297.5 233.8 280.5 216.8C256.4 192.7 256.4 153.6 280.5 129.5C289.9 120.1 301.1 113.6 312 102Z"
        fill="url(#crescentFill)"
      />
      <circle cx="326" cy="140" r="4.5" fill="#E5B26F" />

      {/* Soft clouds */}
      <path
        d="M114 214C114 205.2 121.2 198 130 198C133.4 198 136.5 199 139.1 200.8C142.3 193.3 149.8 188 158.5 188C169.8 188 179 197.2 179 208.5C179 209 179 209.6 178.9 210.1C184.6 211.2 189 216.2 189 222.2C189 229.1 183.4 234.6 176.5 234.6H126C119.4 234.6 114 229.2 114 222.6V214Z"
        fill="#B9D3F4"
        fillOpacity="0.22"
      />
      <path
        d="M368 206C368 199.4 373.4 194 380 194C383.2 194 386.1 195.2 388.3 197.2C391.4 191.7 397.3 188 404 188C413.9 188 422 196.1 422 206C426.4 206.9 429.7 210.8 429.7 215.5C429.7 220.9 425.4 225.2 420 225.2H377C372 225.2 368 221.2 368 216.2V206Z"
        fill="#F0C7DA"
        fillOpacity="0.2"
      />

      {/* Rolling horizon layers */}
      <path
        d="M0 308C92 268 176 274 268 308C360 342 458 264 560 296V440H0V308Z"
        fill="url(#hillBack)"
      />
      <path
        d="M0 340C106 302 202 358 306 324C410 290 486 322 560 344V440H0V340Z"
        fill="url(#hillMid)"
      />
      <path
        d="M0 374C128 346 236 392 356 368C446 350 510 364 560 382V440H0V374Z"
        fill="url(#hillFront)"
      />

      {/* Delicate botanical stems */}
      <path
        d="M148 398C150 362 162 332 182 308"
        stroke="#BCE2D7"
        strokeOpacity="0.6"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse
        cx="166"
        cy="346"
        rx="7"
        ry="14"
        transform="rotate(-32 166 346)"
        fill="#BCE2D7"
        fillOpacity="0.45"
      />
      <ellipse
        cx="182"
        cy="318"
        rx="6"
        ry="12"
        transform="rotate(24 182 318)"
        fill="#D5BCE8"
        fillOpacity="0.55"
      />

      <path
        d="M412 406C408 370 398 344 382 324"
        stroke="#F0C7DA"
        strokeOpacity="0.6"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse
        cx="396"
        cy="354"
        rx="6"
        ry="13"
        transform="rotate(30 396 354)"
        fill="#F0C7DA"
        fillOpacity="0.45"
      />
    </svg>
  );
};

export const CalmHorizonOrb: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 240 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <circle cx="120" cy="80" r="64" fill="#B18ACD" fillOpacity="0.14" />
    <circle cx="152" cy="64" r="40" fill="#78A6E7" fillOpacity="0.16" />
    <path
      d="M128 46C113 49 103 63 106 78C109 93 123 103 138 100C144 98.8 149 95.8 153 91.8C144.4 94 135 91.5 129 85.4C120.5 76.9 120.5 63.1 129 54.6C132.2 51.4 136 49.1 140 47.4C136.2 46.1 132.1 45.6 128 46Z"
      fill="#EAE0F3"
      fillOpacity="0.9"
    />
    <circle cx="148" cy="61" r="2.8" fill="#E5B26F" />
    <path
      d="M54 122C86 106 118 118 148 110C168 104.5 182 110 192 116"
      stroke="#76BBAA"
      strokeOpacity="0.55"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);
