/**
 * Logo CaraCola - Caracol minimalista SVG
 * Usado como marca de identidad en la app
 */

export const CaracolaLogo = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Concha en espiral */}
    <path 
      d="M18 12c0-3.314-2.686-6-6-6-3.314 0-6 2.686-6 6 0 1.657.671 3.157 1.757 4.243" 
      stroke="currentColor" 
      strokeWidth="2" 
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="12" cy="12" r="3" />
    <circle cx="12" cy="12" r="1.5" opacity="0.5" />
    
    {/* Cuerpo del caracol */}
    <path 
      d="M6 16c-.5 1-1 2-1 3 0 1.105.895 2 2 2h2c.552 0 1-.448 1-1v-2" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      fill="none"
      strokeLinecap="round"
    />
    
    {/* Antenas */}
    <line x1="7" y1="11" x2="6" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="9" y1="10" x2="8.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="6" cy="9" r="0.8" />
    <circle cx="8.5" cy="8" r="0.8" />
  </svg>
);

export default CaracolaLogo;
