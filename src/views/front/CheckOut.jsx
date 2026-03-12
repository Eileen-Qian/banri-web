import axios from "axios";
const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { ThreeDots } from "react-loader-spinner";
import { useTranslation } from "react-i18next";
import { currency } from "../../utils/currency";
import useMessage from "../../hooks/useMessage";
import { emailValidation, taiwanPhoneValidation, nameValidation, addressValidation } from "../../utils/validation";

const fetchCart = async () => {
  const res = await axios.get(`${API_BASE}/api/${API_PATH}/cart`);
  return res.data.data;
};

function CheckOut() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [cart, setCart] = useState(null);
  const [isChecking, setIsChecking] = useState(null);
  const { showSuccess, showError } = useMessage();

  useEffect(() => {
    const init = async () => {
      try {
        const data = await fetchCart();
        setCart(data);
      } catch (error) {
        showError(error.response.data.message);
      }
    };
    init();
  }, [showError]);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    defaultValues: { email: "", name: "", tel: "", address: "" },
  });

  // 語言切換後，對已顯示錯誤的欄位重新觸發驗證，使 error message 更新至新語言
  const errorsRef = useRef(errors);
  errorsRef.current = errors;
  useEffect(() => {
    const errorFields = Object.keys(errorsRef.current);
    if (errorFields.length > 0) {
      trigger(errorFields);
    }
    // trigger 為穩定 ref，不需加入；只在語言切換時執行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  const onSubmit = async (formData) => {
    const { message, ...user } = formData;
    setIsChecking(true);
    try {
      const res = await axios.post(`${API_BASE}/api/${API_PATH}/order`, {
        data: { user, message },
      });      
      const orderId = res.data.orderId;
      fetchCart();
      showSuccess(t("api.placeOrderSuccess", { orderId }));
      navigate("/products");
    } catch (error) {
      showError(error.response.data.message);
    } finally {
      setIsChecking(null);
    }
  };

  if (!cart)
    return <p className="text-center fs-2 mt-5">{t("common.loading")}</p>;

  if (cart.carts.length === 0) {
    return (
      <>
        <p className="text-center fs-4 mt-5">{t("common.cartEmpty")}</p>
        <NavLink className="nav-link" to="/products">
          <button className="btn btn-primary">{t("common.goShopping")}</button>
        </NavLink>
      </>
    );
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4">{t("checkout.title")}</h2>
      <NavLink className="nav-link text-end" to="/cart">
        <button className="btn btn-primary">{t("checkout.backToCart")}</button>
      </NavLink>
      <div style={{ maxHeight: "250px", overflowY: "auto" }}>
        <table className="table align-middle mb-0">
          <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
            <tr>
              <th style={{ width: "100px" }}>{t("common.image")}</th>
              <th style={{ width: "200px" }}>{t("common.productName")}</th>
              <th style={{ width: "120px" }}>{t("common.unitPrice")}</th>
              <th style={{ width: "200px" }}>{t("common.quantity")}</th>
              <th style={{ width: "120px" }}>{t("common.subtotal")}</th>
            </tr>
          </thead>
          <tbody>
            {cart.carts.map((item) => (
              <tr key={item.id}>
                <td>
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.title}
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "cover",
                    }}
                  />
                </td>
                <td>{item.product.title}</td>
                <td>NT$ {currency(item.product.price)}</td>
                <td>
                  <span className="fs-3 text-primary">{item.qty}</span>
                </td>
                <td>NT$ {currency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <table className="table align-middle mb-0">
        <tfoot>
          <tr>
            <td style={{ width: "500px" }}></td>
            <td></td>
            <td></td>
            <td style={{ width: "200px" }} className="text-end fw-bold">
              {t("common.total")}
            </td>
            <td style={{ width: "200px" }} className="text-end fw-bold">
              NT$ {currency(cart.final_total)}
            </td>
          </tr>
        </tfoot>
      </table>
      <div className="my-5 row justify-content-center">
        <form className="col-md-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              {t("checkout.email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-control"
              placeholder={t("checkout.emailPlaceholder")}
              {...register("email", emailValidation(t))}
            />
            {errors.email && (
              <p className="text-danger">{errors.email.message}</p>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              {t("checkout.name")}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="form-control"
              placeholder={t("checkout.namePlaceholder")}
              {...register("name", nameValidation(t))}
            />
            {errors.name && (
              <p className="text-danger">{errors.name.message}</p>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="tel" className="form-label">
              {t("checkout.phone")}
            </label>
            <input
              id="tel"
              name="tel"
              type="tel"
              className="form-control"
              placeholder={t("checkout.phonePlaceholder")}
              {...register("tel", taiwanPhoneValidation(t))}
            />
            {errors.tel && <p className="text-danger">{errors.tel.message}</p>}
          </div>

          <div className="mb-3">
            <label htmlFor="address" className="form-label">
              {t("checkout.address")}
            </label>
            <input
              id="address"
              name="address"
              type="text"
              className="form-control"
              placeholder={t("checkout.addressPlaceholder")}
              {...register("address", addressValidation(t))}
            />
            {errors.address && (
              <p className="text-danger">{errors.address.message}</p>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="message" className="form-label">
              {t("checkout.message")}
            </label>
            <textarea
              id="message"
              className="form-control"
              cols="30"
              rows="10"
              {...register("message")}
            ></textarea>
          </div>
          <div className="text-end">
            <button type="submit" className="btn btn-primary w-100">
              {isChecking ? (
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
                t("checkout.submitOrder")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CheckOut;
