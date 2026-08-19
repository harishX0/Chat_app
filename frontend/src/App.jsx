import { Navigate, Route, Routes } from "react-router-dom";

import PrivateRoute from "./components/PrivateRoute";
import { useAuth } from "./context/AuthContext";
import ChatPage from "./pages/ChatPage";
import FeedPage from "./pages/FeedPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="screen-center">Restoring your session...</div>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <ChatPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/feed"
        element={
          <PrivateRoute>
            <FeedPage currentUser={user} />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
