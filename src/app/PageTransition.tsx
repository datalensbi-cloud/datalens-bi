import { useLocation, Outlet } from 'react-router-dom';

/**
 * Lightweight fade transition between routes.
 * Re-keying on pathname forces React to remount the outlet,
 * which retriggers the tailwindcss-animate fade-in.
 */
export function PageTransition() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-in fade-in duration-200">
      <Outlet />
    </div>
  );
}
