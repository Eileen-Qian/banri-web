import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router";
import { RotatingLines } from "react-loader-spinner";
import { useTranslation } from "react-i18next";
import { api } from "../utils/api";
import useMessage from "../hooks/useMessage";

function ProtectedRoute({ children }) {
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { showError } = useMessage();
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    const checkLogin = async () => {
      setIsLoading(true);
      try {
        await api.get("/api/v1/admin/verify");
        setIsAuth(true);
      } catch {
        showError(tRef.current("api.sessionExpired"));
      } finally {
        setIsLoading(false);
      }
    };
    checkLogin();
  }, [showError]);

  if (isLoading)
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "calc(100vh - 200px)" }}
      >
        <RotatingLines width="80" color="var(--bs-primary)" />
      </div>
    );
  if (!isAuth) return <Navigate to="/login" />;
  return children;
}

export default ProtectedRoute;
