import axios from "axios";
const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

import { useEffect, useState } from "react";
import { Oval } from "react-loader-spinner";
import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { currency } from "../../utils/currency";
import useMessage from "../../hooks/useMessage.jsx";

const fetchCart = async () => {
  const res = await axios.get(`${API_BASE}/api/${API_PATH}/cart`);
  return res.data.data;
};

function Cart() {
  const [cart, setCart] = useState(null);
  const [loadingCartId, setLoadingCartId] = useState(null);
  const { t } = useTranslation();
  const { showSuccess, showError } = useMessage();

  useEffect(() => {
    const init = async () => {
      try {
        const data = await fetchCart();
        setCart(data);
      } catch (error) {
        console.error(error);
        showError(error.response.data.message);
      }
    };
    init();
  }, [showError]);

  const getCart = async () => {
    try {
      const data = await fetchCart();
      setCart(data);
    } catch (error) {
      console.error(error);
    }
  };

  const updateCartItem = async (cartId, productId, qty) => {
    setLoadingCartId(cartId);
    try {
      await axios.put(`${API_BASE}/api/${API_PATH}/cart/${cartId}`, {
        data: { product_id: productId, qty },
      });
      getCart();
      showSuccess(t("api.updateCartSuccess"));
    } catch (error) {
      showError(error.response.data.message);
    } finally {
      setLoadingCartId(null);
    }
  };

  const removeCartItem = async (cartId) => {
    setLoadingCartId(cartId);
    try {
      await axios.delete(`${API_BASE}/api/${API_PATH}/cart/${cartId}`);
      getCart();
      showSuccess(t("api.removeCartSuccess"));
    } catch (error) {
      showError(error.response.data.message);
    } finally {
      setLoadingCartId(null);
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
      <h2 className="mb-4">{t("cart.title")}</h2>
      <div className="d-flex justify-content-end">
        <NavLink className="nav-link" to="/checkout">
          <button className="btn btn-primary">{t("cart.goCheckout")}</button>
        </NavLink>
      </div>
      <table className="table align-middle">
        <thead>
          <tr>
            <th style={{ width: "100px" }}>{t("common.image")}</th>
            <th>{t("common.productName")}</th>
            <th style={{ width: "200px" }}>{t("common.quantity")}</th>
            <th style={{ width: "120px" }}>{t("common.subtotal")}</th>
            <th style={{ width: "80px" }}>{t("cart.action")}</th>
          </tr>
        </thead>
        <tbody>
          {cart.carts.map((item) => (
            <tr key={item.id}>
              <td>
                <img
                  src={item.product.imageUrl}
                  alt={item.product.title}
                  style={{ width: "80px", height: "80px", objectFit: "cover" }}
                />
              </td>
              <td>{item.product.title}</td>
              <td>
                <div className="input-group" style={{ width: "150px" }}>
                  <button
                    className="btn btn-outline-primary btn-sm"
                    type="button"
                    onClick={() =>
                      updateCartItem(item.id, item.product.id, item.qty - 1)
                    }
                    disabled={item.qty <= 1 || loadingCartId === item.id}
                  >
                    {loadingCartId === item.id ? (
                      <Oval
                        visible={true}
                        height="20"
                        width="20"
                        ariaLabel="oval-loading"
                      />
                    ) : (
                      "-"
                    )}
                  </button>
                  <input
                    type="number"
                    className="form-control text-center"
                    value={item.qty}
                    readOnly
                  />
                  <button
                    className="btn btn-outline-primary btn-sm"
                    type="button"
                    onClick={() =>
                      updateCartItem(item.id, item.product.id, item.qty + 1)
                    }
                    disabled={item.qty >= 10 || loadingCartId === item.id}
                  >
                    {loadingCartId === item.id ? (
                      <Oval
                        visible={true}
                        height="20"
                        width="20"
                        ariaLabel="oval-loading"
                      />
                    ) : (
                      "+"
                    )}
                  </button>
                </div>
              </td>
              <td>NT$ {currency(item.total)}</td>
              <td>
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => removeCartItem(item.id)}
                >
                  {loadingCartId === item.id ? (
                    <Oval
                      visible={true}
                      height="20"
                      width="20"
                      ariaLabel="oval-loading"
                    />
                  ) : (
                    t("cart.delete")
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="3" className="text-end fw-bold">
              {t("common.total")}
            </td>
            <td colSpan="2" className="fw-bold">
              NT$ {currency(cart.final_total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default Cart;
