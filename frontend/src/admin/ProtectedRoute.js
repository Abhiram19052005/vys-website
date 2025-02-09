import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ Component, isAuthenticated }) => {
  return isAuthenticated ? <Component /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
