import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import { Oval } from "react-loader-spinner";
import { useTranslation } from "react-i18next";

import { api, localizedName, primaryImageUrl, cartHeaders } from "../../utils/api";
import { currency } from "../../utils/currency";
import useMessage from "../../hooks/useMessage.jsx";

function Cart() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useMessage();
  const [items, setItems] = useState(null);
  const [total, setTotal] = useState("0");
  const [loadingId, setLoadingId] = useState(null);
  const [isClearing, setIsClearing] = useState(false);

  const fetchCart = async () => {
    try {
      const res = await api.get("/api/v1/cart", { headers: cartHeaders() });
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchCart(); }, []);

  const applyCartResponse = (data) => {
    setItems(data.items);
    setTotal(data.total);
  };

  const updateQty = async (itemId, qty) => {
    setLoadingId(itemId);
    try {
      const res = await api.put(`/api/v1/cart/items/${itemId}`, { qty }, { headers: cartHeaders() });
      console.log(res);
      
      applyCartResponse(res.data);
      showSuccess(t("api.updateCartSuccess"));
    } catch (error) {
      showError(error.response?.data?.error || error.message);
    } finally {
      setLoadingId(null);
    }
  };

  const removeItem = async (itemId) => {
    setLoadingId(itemId);
    try {
      const res = await api.delete(`/api/v1/cart/items/${itemId}`, { headers: cartHeaders() });
      applyCartResponse(res.data);
      showSuccess(t("api.removeCartSuccess"));
    } catch (error) {
      showError(error.response?.data?.error || error.message);
    } finally {
      setLoadingId(null);
    }
  };

  const clearCart = async () => {
    setIsClearing(true);
    try {
      const res = await api.delete("/api/v1/cart", { headers: cartHeaders() });
      applyCartResponse(res.data);
      showSuccess(t("api.clearCartSuccess"));
    } catch (error) {
      showError(error.response?.data?.error || error.message);
    } finally {
      setIsClearing(false);
    }
  };

  if (items === null)
    return <p className="text-center fs-2 mt-5">{t("common.loading")}</p>;

  if (items.length === 0) {
    return (
      <div className="container mt-5 text-center">
        <p className="fs-4">{t("common.cartEmpty")}</p>
        <NavLink className="btn btn-primary" to="/products">
          {t("common.goShopping")}
        </NavLink>
      </div>
    );
  }

  const subtotal = Number(total);

  return (
    <div className="container mt-5">
      <h2 className="mb-4">{t("cart.title")}</h2>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <button
          className="btn btn-outline-danger"
          onClick={clearCart}
          disabled={isClearing}
        >
          <i className="bi bi-trash me-1" />
          {t("cart.clearCart")}
        </button>
        <NavLink className="btn btn-primary" to="/checkout">
          {t("cart.goCheckout")}
        </NavLink>
      </div>

      {/* Items table */}
      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th style={{ width: "100px" }}>{t("common.image")}</th>
              <th>{t("common.productName")}</th>
              <th style={{ width: "120px" }}>{t("common.unitPrice")}</th>
              <th style={{ width: "200px" }}>{t("common.quantity")}</th>
              <th style={{ width: "120px" }}>{t("common.subtotal")}</th>
              <th style={{ width: "80px" }}>{t("cart.action")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const v = item.variant;
              const imgUrl = primaryImageUrl(v.product?.images || []);
              const itemTotal = Number(v.price) * item.qty;
              return (
                <tr key={item.id}>
                  <td>
                    {imgUrl && (
                      <img
                        src={imgUrl}
                        alt={localizedName(v.product?.name)}
                        style={{ width: "80px", height: "80px", objectFit: "cover" }}
                      />
                    )}
                  </td>
                  <td>
                    <div>{localizedName(v.product?.name)}</div>
                    <small className="text-muted">{localizedName(v.size?.name)}</small>
                  </td>
                  <td>NT$ {currency(Number(v.price))}</td>
                  <td>
                    <div className="input-group" style={{ width: "150px" }}>
                      <button
                        className="btn btn-outline-primary btn-sm"
                        type="button"
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        disabled={item.qty <= 1 || loadingId === item.id}
                      >
                        {loadingId === item.id ? <Oval visible height="20" width="20" /> : "-"}
                      </button>
                      <input type="number" className="form-control text-center" value={item.qty} readOnly />
                      <button
                        className="btn btn-outline-primary btn-sm"
                        type="button"
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        disabled={item.qty >= 10 || loadingId === item.id}
                      >
                        {loadingId === item.id ? <Oval visible height="20" width="20" /> : "+"}
                      </button>
                    </div>
                  </td>
                  <td>NT$ {currency(itemTotal)}</td>
                  <td>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => removeItem(item.id)}
                      disabled={loadingId === item.id}
                    >
                      {loadingId === item.id ? <Oval visible height="20" width="20" /> : t("cart.delete")}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="row mt-4 justify-content-end">
        <div className="col-md-5 col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between fw-bold fs-5 mb-3">
                <span>{t("cart.subtotal")}</span>
                <span>NT$ {currency(subtotal)}</span>
              </div>
              <small className="text-muted d-block mb-3">
                {t("cart.shippingCalcHint")}
                {<br />}
                <NavLink to="/shipping" className="text-primary text-decoration-none">
                  {t("shipping.shippingLink")} <i className="bi bi-box-arrow-up-right" />
                </NavLink>
              </small>
              <NavLink className="btn btn-primary w-100" to="/checkout">
                {t("cart.goCheckout")}
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;
