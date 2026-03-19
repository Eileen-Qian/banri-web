import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { ThreeDots } from "react-loader-spinner";
import { useTranslation } from "react-i18next";

import { api, setAuthToken } from "../../utils/api";
import { passwordValidation } from "../../utils/validation";
import useMessage from "../../hooks/useMessage";

function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showSuccess, showError } = useMessage();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    defaultValues: { account: "", password: "" },
  });
  const [isLoading, setIsLoading] = useState(null);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        await api.get("/api/v1/admin/verify");
        navigate("/admin");
      } catch {
        // not logged in — stay on login page
      }
    };
    checkLogin();
  }, [navigate]);

  const onSubmit = async (formData) => {
    setIsLoading(true);
    try {
      const res = await api.post("/api/v1/admin/login", {
        account: formData.account,
        password: formData.password,
      });

      setAuthToken(res.data.token);
      showSuccess(t("api.loginSuccess"));
      setTimeout(() => navigate("/admin/products"), 500);
    } catch (error) {
      showError(error.response?.data?.error || error.message);
    } finally {
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  return (
    <div className="container login">
      <button className="btn btn-outline-primary" onClick={() => navigate("/")}>
        {t("admin.login.backToFront")}
      </button>
      <div className="row justify-content-center">
        <h1 className="h3 mb-3 font-weight-normal">{t("admin.login.title")}</h1>
        <div className="col-8">
          <form className="form-signin" onSubmit={handleSubmit(onSubmit)}>
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control"
                id="account"
                placeholder={t("admin.login.accountLabel")}
                {...register("account", {
                  required: t("validation.accountRequired"),
                })}
                autoFocus
              />
              <label htmlFor="account">{t("admin.login.accountLabel")}</label>
              {errors.account && (
                <p className="text-danger">{errors.account.message}</p>
              )}
            </div>
            <div className="form-floating">
              <input
                type="password"
                className="form-control"
                id="password"
                placeholder={t("admin.login.passwordLabel")}
                {...register("password", passwordValidation(t))}
              />
              <label htmlFor="password">{t("admin.login.passwordLabel")}</label>
              {errors.password && (
                <p className="text-danger">{errors.password.message}</p>
              )}
            </div>
            <button className="btn btn-lg btn-primary w-100 mt-3" type="submit">
              {isLoading ? (
                <ThreeDots
                  visible={true}
                  height="30"
                  width="80"
                  color="#fff"
                  radius="9"
                  ariaLabel="three-dots-loading"
                  wrapperStyle={{ display: "flex", justifyContent: "center" }}
                />
              ) : (
                t("admin.login.submit")
              )}
            </button>
          </form>
        </div>
      </div>
      <p className="mt-5 mb-3 text-muted">
        &copy; {new Date().getFullYear()} - {t("admin.login.copyright")}
      </p>
    </div>
  );
}

export default Login;
