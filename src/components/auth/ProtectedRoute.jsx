import { Navigate, Outlet, useOutletContext } from "react-router-dom";

export function ProtectedRoute({ session }) {
  const context = useOutletContext();

  if (!session) {
    return <Navigate replace to="/" />;
  }

  return <Outlet context={context} />;
}
