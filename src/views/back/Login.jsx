import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { useForm } from "react-hook-form";
import { ThreeDots } from "react-loader-spinner";
import { useTranslation } from "react-i18next";

import { emailValidation, passwordValidation } from "../../utils/validation";
import useMessage from "../../hooks/useMessage";

const API_BASE = import.meta.env.VITE_API_BASE;

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
    defaultValues: {
      username: "",
      password: "",
    },
  });
  const [isLoading, setIsLoading] = useState(null);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        await axios.post(`${API_BASE}/api/user/check`);
        navigate("/admin");
      } catch (error) {
        console.error(error.response.data.message);
      }
    };
    checkLogin();
  }, [navigate]);

  const onSubmit = async (formData) => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/admin/signin`, formData);
      const { token, expired } = res.data;
      document.cookie = `hexW2Token=${token}; expires=${new Date(expired)}; path=/hex-2025-react-week7;`;
      axios.defaults.headers.common["Authorization"] = token;
      setTimeout(() => {
        navigate("/admin/products");
      }, 500);
      showSuccess(t("api.loginSuccess"));
    } catch (error) {
      showError(error.response.data.message);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  };

  return (
    <>
      <div className="container login">
        <button
          className="btn btn-outline-primary"
          onClick={() => navigate("/")}
        >
          {t("admin.login.backToFront")}
        </button>
        <div className="row justify-content-center">
          <h1 className="h3 mb-3 font-weight-normal">
            {t("admin.login.title")}
          </h1>
          <div className="col-8">
            <form
              id="form"
              className="form-signin"
              onSubmit={handleSubmit(onSubmit)}
            >
              <div className="form-floating mb-3">
                <input
                  type="email"
                  className="form-control"
                  id="username"
                  name="username"
                  placeholder="name@example.com"
                  {...register("username", emailValidation(t))}
                  autoFocus
                />
                <label htmlFor="username">{t("admin.login.emailLabel")}</label>
                {errors.username && (
                  <p className="text-danger">{errors.username.message}</p>
                )}
              </div>
              <div className="form-floating">
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  name="password"
                  placeholder="Password"
                  {...register("password", passwordValidation(t))}
                />
                <label htmlFor="password">{t("admin.login.passwordLabel")}</label>
                {errors.password && (
                  <p className="text-danger">{errors.password.message}</p>
                )}
              </div>
              <button
                className="btn btn-lg btn-primary w-100 mt-3"
                type="submit"
              >
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
          &copy; 2024~∞ - {t("admin.login.copyright")}
        </p>
      </div>
    </>
  );
}

export default Login;
