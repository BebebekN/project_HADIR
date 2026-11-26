import React from 'react';

export default function HadirLogo({
  variant = 'full',
  className = '',
  showWordmark = true,
  inverted = false,
}) {
  const primaryColor = inverted ? '#FFFFFF' : '#122B51';
  const accentColor = '#00C2B3';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {variant === 'squircle' ? (
        <svg
          width="40"
          height="40"
          viewBox="0 0 64 64"
          fill="none"
          aria-label="Logo HADIR"
          className="shrink-0"
        >
          <rect x="2" y="2" width="60" height="60" rx="15" fill="#122B51" />
          <path d="M17 20C17 15.8 19.4 14 23.2 14H26.5V27.6L17 36.4V20Z" fill="#FFFFFF" />
          <path d="M17 40.2L21.5 36.2C23.8 34.2 26.5 35.6 26.5 38.6V50H21.5C18.3 50 17 47.9 17 45V40.2Z" fill="#FFFFFF" />
          <path d="M37.5 19.2C37.5 15.6 39.8 14 43.4 14H47V18.2L37.5 28V19.2Z" fill="#FFFFFF" />
          <path d="M37.5 36.4L47 25.8V44.6C47 48.1 44.7 50 41 50H37.5V36.4Z" fill="#FFFFFF" />
          <path d="M19.8 35.4L24.8 31.2L30.8 37.2L47.8 18.8L49 24L32.2 43.2C31.1 44.4 29.5 44.4 28.4 43.2L19.8 35.4Z" fill={accentColor} />
        </svg>
      ) : (
        <svg
          width="38"
          height="38"
          viewBox="0 0 64 64"
          fill="none"
          aria-label="Logo HADIR"
          className="shrink-0"
        >
          <path d="M10 18C10 12.2 13.2 10 19 10H23.5V27.5L10 39.5V18Z" fill={primaryColor} />
          <path d="M10 43.5L16.5 38C19.5 35.5 23.5 37.5 23.5 41.5V54H16C11.5 54 10 51 10 47V43.5Z" fill={primaryColor} />
          <path d="M40.5 17C40.5 12 43.5 10 49 10H54V15.5L40.5 29.5V17Z" fill={primaryColor} />
          <path d="M40.5 38.5L54 24V46.5C54 51.5 51 54 45.5 54H40.5V38.5Z" fill={primaryColor} />
          <path d="M14.5 37L20.5 32L29.5 40.5L53 16.5L54 23L31 48.5C29.8 49.8 28 49.8 26.8 48.5L14.5 37Z" fill={accentColor} />
        </svg>
      )}

      {showWordmark && (
        <svg
          height="22"
          viewBox="0 0 132 30"
          fill="none"
          aria-label="HADIR"
          className="shrink-0"
        >
          {/* H */}
          <path d="M2 3H8V12.5H19V3H25V27H19V17.5H8V27H2V3Z" fill={primaryColor} />
          {/* Crossbar-less Geometric A (Λ) matching uploaded HADIR mark */}
          <path d="M30 27L40.5 3H47L57.5 27H51L43.8 10L36.5 27H30Z" fill={primaryColor} />
          {/* D */}
          <path fillRule="evenodd" clipRule="evenodd" d="M62 3H73.5C80.8 3 85.5 7.7 85.5 15C85.5 22.3 80.8 27 73.5 27H62V3ZM68 8.2V21.8H73C77.3 21.8 79.5 19.3 79.5 15C79.5 10.7 77.3 8.2 73 8.2H68Z" fill={primaryColor} />
          {/* I */}
          <path d="M90.5 3H96.5V27H90.5V3Z" fill={primaryColor} />
          {/* R */}
          <path fillRule="evenodd" clipRule="evenodd" d="M103 3H115.5C121.2 3 125 6.3 125 11.2C125 14.9 122.9 17.7 119.3 18.8L125.8 27H118.8L113 19.4H109V27H103V3ZM109 8V14.8H115C117.7 14.8 119.2 13.4 119.2 11.4C119.2 9.4 117.7 8 115 8H109Z" fill={primaryColor} />
        </svg>
      )}
    </div>
  );
}
