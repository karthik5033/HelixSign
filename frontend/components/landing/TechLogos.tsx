import React from "react";

export function PythonLogo({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" {...props}>
      <path
        fill="#387EB8"
        d="M11.914 2c-5.454 0-5.127 2.364-5.127 2.364l.006 2.45h5.204v.735H4.79S2 7.234 2 12.693c0 5.459 2.44 5.253 2.44 5.253h1.458v-2.052s-.08-2.449 2.39-2.449h5.18v-.764h-7.3v-2.45h7.327s2.528.055 2.528-2.45V4.364S16.337 2 11.914 2zm-1.42 1.48a.92.92 0 1 1 0 1.84.92.92 0 0 1 0-1.84z"
      />
      <path
        fill="#FFE873"
        d="M12.086 22c5.454 0 5.127-2.364 5.127-2.364l-.006-2.45h-5.204v-.735h7.207S22 16.766 22 11.307c0-5.459-2.44-5.253-2.44-5.253h-1.458v2.052s.08 2.449-2.39 2.449h-5.18v.764h7.3v2.45h-7.327s-2.528-.055-2.528 2.45v3.818S7.663 22 12.086 22zm1.42-1.48a.92.92 0 1 1 0-1.84.92.92 0 0 1 0 1.84z"
      />
    </svg>
  );
}

export function PyTorchLogo({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" {...props}>
      <path
        fill="#EE4C2C"
        d="M13.5 2.5a.75.75 0 0 0-1.2.6 10.3 10.3 0 0 1-.3 2.3 8.3 8.3 0 0 1-5.6 5.5A7.8 7.8 0 1 0 17 12.8c0-2.4-1-4.7-2.7-6.5a14.7 14.7 0 0 1-.8-3.8zM12 18.2a5.4 5.4 0 0 1-5.4-5.4c0-1.7.8-3.3 2.1-4.3a.6.6 0 0 1 .9.7 4 4 0 0 0-.6 2.2 4.1 4.1 0 0 0 4.1 4.1 4 4 0 0 0 2.2-.7.6.6 0 0 1 .7.9 5.4 5.4 0 0 1-4 3.4z"
      />
      <circle cx="16.5" cy="4.5" r="1.5" fill="#EE4C2C" />
    </svg>
  );
}

export function BiopythonLogo({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" {...props}>
      <path
        d="M4 3.5c3.5 4 5 7.5 8 8.5s4.5 4.5 8 8.5M20 3.5c-3.5 4-5 7.5-8 8.5s-4.5 4.5-8 8.5"
        stroke="#E16A34"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M6.5 6.5h11M8.5 9.5h7M8.5 14.5h7M6.5 17.5h11"
        stroke="#3689E6"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2.2" fill="#E16A34" />
    </svg>
  );
}

export function ReedSoloLogo({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3.5" stroke="#F59E0B" strokeWidth="1.5" fill="#F59E0B" fillOpacity="0.15" />
      <path d="M6.5 8h11M6.5 12h11M6.5 16h6" stroke="#F59E0B" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="16.5" cy="16" r="2" fill="#F59E0B" />
      <path d="M12 4v16" stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="2 2" strokeOpacity="0.4" />
    </svg>
  );
}

export function NumPyLogo({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" {...props}>
      <path fill="#4DABCF" d="M12 2.5l8.5 4.9v9.8L12 22.1l-8.5-4.9V7.4L12 2.5z" />
      <path fill="#013243" opacity="0.3" d="M12 2.5l8.5 4.9-8.5 4.9-8.5-4.9L12 2.5z" />
      <path fill="#013243" opacity="0.45" d="M12 12.3v9.8l-8.5-4.9V7.4L12 12.3z" />
      <path
        fill="#FFFFFF"
        d="M8.5 8.5v7h1.8v-4.2l3.4 4.2h1.8v-7h-1.8v4.2L10.3 8.5H8.5z"
      />
    </svg>
  );
}

export function SciPyLogo({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" {...props}>
      <circle cx="12" cy="12" r="9" stroke="#0054A6" strokeWidth="1.8" strokeDasharray="3 2" />
      <path
        d="M7.5 14.5c.9 1.8 2.5 2.8 4.5 2.8 2.8 0 5-2.2 5-5s-5-2.8-5-6c0-1.5 1.2-2.8 2.8-2.8 1.4 0 2.5.8 3 2"
        stroke="#0054A6"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="7.5" cy="8.5" r="1.8" fill="#4DABCF" />
      <circle cx="16.5" cy="15.5" r="1.8" fill="#FF5500" />
    </svg>
  );
}

export function ScikitLearnLogo({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" {...props}>
      <path
        d="M12 3l7.5 4.3v8.6L12 20.2 4.5 15.9V7.3L12 3z"
        stroke="#3499CD"
        strokeWidth="1.4"
        fill="#3499CD"
        fillOpacity="0.12"
      />
      <path d="M12 7l-5 8m5-8l5 8m-10 0h10" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.6" />
      <circle cx="12" cy="7" r="2.2" fill="#F89939" />
      <circle cx="7" cy="15" r="2.2" fill="#3499CD" />
      <circle cx="17" cy="15" r="2.2" fill="#3499CD" />
    </svg>
  );
}

export function FastApiLogo({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" {...props}>
      <circle cx="12" cy="12" r="10" fill="#009688" />
      <path fill="#FFFFFF" d="M12.5 4L6 13h5l-1 7 7.5-10h-5l1-6z" />
    </svg>
  );
}

export function NextJsLogo({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" {...props}>
      <circle cx="12" cy="12" r="10" fill="#000000" stroke="#333333" strokeWidth="1.2" />
      <path fill="#FFFFFF" d="M8.5 7.5h1.8v9H8.5z" />
      <path fill="url(#nextGradLogo)" d="M10 7.5l5.8 7.6.9-.7-5.4-7H10z" />
      <path fill="#FFFFFF" d="M14.5 7.5h1.8v4.8h-1.8z" />
      <defs>
        <linearGradient id="nextGradLogo" x1="10" y1="7.5" x2="16" y2="15.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Table11Logo({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3.5" stroke="#FF5500" strokeWidth="1.5" fill="#FF5500" fillOpacity="0.12" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" stroke="#FF5500" strokeWidth="1" strokeOpacity="0.3" />
      <path d="M6 6h2M6 12h2M12 12h2M18 18h-2" stroke="#FF5500" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3.5" fill="#181822" stroke="#FF5500" strokeWidth="1" />
      <text x="12" y="14.5" fill="#FF5500" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
        11
      </text>
    </svg>
  );
}

export function TwistIdtLogo({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" {...props}>
      <rect x="3" y="4" width="18" height="16" rx="3" stroke="#00A3E0" strokeWidth="1.5" fill="#00A3E0" fillOpacity="0.1" />
      <circle cx="7.5" cy="8.5" r="1.5" fill="#00A3E0" />
      <circle cx="12" cy="8.5" r="1.5" fill="#00A3E0" />
      <circle cx="16.5" cy="8.5" r="1.5" fill="#00A3E0" />
      <circle cx="7.5" cy="12" r="1.5" fill="#00A3E0" />
      <circle cx="12" cy="12" r="1.7" fill="#FF5500" />
      <circle cx="16.5" cy="12" r="1.5" fill="#00A3E0" />
      <circle cx="7.5" cy="15.5" r="1.5" fill="#00A3E0" />
      <circle cx="12" cy="15.5" r="1.5" fill="#00A3E0" />
      <circle cx="16.5" cy="15.5" r="1.5" fill="#00A3E0" />
    </svg>
  );
}

export function NcbiLogo({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" {...props}>
      <path
        d="M12 2.5L4.5 5.8v5.8c0 4.8 3.2 9.2 7.5 10.4 4.3-1.2 7.5-5.6 7.5-10.4V5.8L12 2.5z"
        stroke="#205493"
        strokeWidth="1.6"
        fill="#205493"
        fillOpacity="0.15"
      />
      <path
        d="M8.5 12l2.5 2.5 5-5"
        stroke="#205493"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.5 7.5h7" stroke="#205493" strokeWidth="1.2" strokeOpacity="0.5" />
    </svg>
  );
}

