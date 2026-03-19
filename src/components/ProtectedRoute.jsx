import { useEffect, useState } from "react";
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

  useEffect(() => {
    const checkLogin = async () => {
      setIsLoading(true);
      try {
        await api.get("/api/v1/admin/verify");
        setIsAuth(true);
      } catch {
        showError(t("api.sessionExpired"));
      } finally {
        setIsLoading(false);
      }
    };
    checkLogin();
  }, [showError, t]);

  if (isLoading)
    return (
      <RotatingLines
        color={"var(--bs-primary)"}
        wrapperStyle={{ justifyContent: "center" }}
      />
    );
  if (!isAuth) return <Navigate to="/login" />;
  return children;
}

export default ProtectedRoute;
