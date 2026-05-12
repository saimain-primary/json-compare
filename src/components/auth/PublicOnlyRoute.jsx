import { Navigate, Outlet, useOutletContext } from "react-router-dom";

export function PublicOnlyRoute({ session }) {
  const context = useOutletContext();

  if (session) {
    return <Navigate replace to="/collections" />;
  }

  return <Outlet context={context} />;
}
