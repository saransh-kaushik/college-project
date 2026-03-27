import { Navigate, useLocation } from 'react-router-dom';
import { isLoggedIn } from '../services/api.js';

/**
 * Wraps any route that requires authentication.
 * If the user is not logged in, redirects to /login
 * and preserves the intended destination in `state.from`.
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!isLoggedIn()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
