
import { Navigate, Outlet } from 'react-router-dom';

interface RoleRouteProps {
  allowedRoles: string[];
  userRole: string | null;
}

export default function RoleRoute({ allowedRoles, userRole }: RoleRouteProps) {
  if (!userRole) {
    // Possibly still loading or not authenticated
    return <Navigate to="/" replace />;
  }

  return allowedRoles.includes(userRole) ? <Outlet /> : <Navigate to="/" replace />;
}
