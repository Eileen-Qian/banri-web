import { useEffect, useState } from "react";
import { NavLink, useParams, useLocation } from "react-router";
import { useTranslation } from "react-i18next";

import { api, localizedName } from "../../utils/api";
import { currency } from "../../utils/currency";
import { getLineLoginUrl, exchangeLineCode } from "../../utils/lineLogin";

function OrderSuccess() {
  const { id } = useParams();
  const { state } = useLocation();
  const { t } = useTranslation();

  // Prefer router state (immediate); fall back to API fetch (page refresh)
  const [order, setOrder] = useState(state?.order ?? null);
  const [loading, setLoading] = useState(!state?.order);
  const [error, setError] = useState("");
  const [lineLinked, setLineLinked] = useState(false);
  const [linkingLine, setLinkingLine] = useState(false);

  // Fetch order if not from router state
  useEffect(() => {
    if (order) return;
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/api/v1/orders/${id}`);
        setOrder(res.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, order]);

  // Handle LINE Login callback (code saved by main.jsx)
  useEffect(() => {
    const code = sessionStorage.getItem("lineCallbackCode");
    const orderId = sessionStorage.getItem("lineCallbackOrderId");
    if (!code || !orderId || orderId !== id || lineLinked) return;
    sessionStorage.removeItem("lineCallbackCode");
    sessionStorage.removeItem("lineCallbackOrderId");
    setLinkingLine(true);
    exchangeLineCode(code)
      .then(async (data) => {
        await api.put(`/api/v1/orders/${orderId}/link-customer`, {
          customerId: data.customerId,
        });
        setLineLinked(true);
      })
      .catch(() => {})
      .finally(() => setLinkingLine(false));
  }, [id, lineLinked]);

  if (loading) {
    return <p className="text-center fs-2 mt-5">{t("common.loading")}</p>;
  }

  if (error || !order) {
    return (
      <div className="container mt-5 text-center">
        <h2 className="mb-3">{t("orderSuccess.notFound")}</h2>
        <p className="text-muted">{error}</p>
        <NavLink className="btn btn-primary" to="/products">
          {t("common.goShopping")}
        </NavLink>
      </div>
    );
  }

  const subtotal = Number(order.total);
  const methodName = order.deliveryMethodName
    ? localizedName(order.deliveryMethodName)
    : order.deliveryMethodId?.replace("delivery-", "").replace(/_/g, " ");

  return (
    <div className="container mt-5 mb-5">
      {/* Success header */}
      <div className="text-center mb-5">
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 mb-3"
          style={{ width: 80, height: 80 }}
        >
          <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "2.5rem" }} />
        </div>
        <h2 className="fw-bold">{t("orderSuccess.title")}</h2>
        <p className="text-muted fs-5">{t("orderSuccess.subtitle")}</p>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          {/* Order ID card */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <small className="text-muted">{t("orderSuccess.orderId")}</small>
                  <div className="fw-bold">
                    {order.orderNumber || order.id}
                  </div>
                </div>
                <span className={`badge ${order.isPaid ? "bg-success" : "bg-secondary"}`}>
                  {order.isPaid ? t("orderSuccess.paid") : t("orderSuccess.awaitingPayment")}
                </span>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-6">
                  <small className="text-muted">{t("orderSuccess.recipient")}</small>
                  <div>{order.name}</div>
                </div>
                <div className="col-6">
                  <small className="text-muted">{t("orderSuccess.deliveryMethod")}</small>
                  <div>{methodName}</div>
                </div>
              </div>

              {/* Delivery details */}
              {order.city && (
                <div className="mb-3">
                  <small className="text-muted">{t("orderSuccess.deliveryAddress")}</small>
                  <div>{order.city}{order.district} {order.address}</div>
                </div>
              )}
              {order.storeName && (
                <div className="mb-3">
                  <small className="text-muted">{t("orderSuccess.pickupStore")}</small>
                  <div>
                    {order.storeBrandName
                      ? localizedName(order.storeBrandName)
                      : order.storeBrand} — {order.storeName} ({order.storeNumber})
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3">{t("orderSuccess.items")}</h6>
              {order.items.map((item) => (
                <div key={item.id} className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <span>{localizedName(item.productName)}</span>
                    <small className="text-muted ms-2">{localizedName(item.sizeName)}</small>
                    <small className="text-muted ms-1">×{item.qty}</small>
                  </div>
                  <span>NT$ {currency(Number(item.price) * item.qty)}</span>
                </div>
              ))}
              <hr />
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">{t("cart.subtotal")}</span>
                <span>NT$ {currency(subtotal)}</span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">{t("cart.shippingFee")}</span>
                <span className="text-muted">{t("shipping.afterConfirm")}</span>
              </div>
              <div className="d-flex justify-content-between fw-bold fs-5 mt-2">
                <span>{t("cart.grandTotal")}</span>
                <span>NT$ {currency(subtotal)}</span>
              </div>
            </div>
          </div>

          {/* Next steps */}
          <div className="card border-0 shadow-sm mb-4" style={{ background: "var(--bs-primary-bg-subtle, #e7f5ff)" }}>
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3">
                <i className="bi bi-info-circle me-2" />
                {t("orderSuccess.nextStepsTitle")}
              </h6>
              <ol className="mb-0 ps-3">
                <li className="mb-2">{t("orderSuccess.step1")}</li>
                <li className="mb-2">{t("orderSuccess.step2")}</li>
                <li>{t("orderSuccess.step3")}</li>
              </ol>
            </div>
          </div>

          {/* LINE Login */}
          {!order.customerId && (
            <div className="card border-0 shadow-sm mb-4" style={{ background: "#eafbea" }}>
              <div className="card-body p-4 text-center">
                {lineLinked ? (
                  <div className="text-success">
                    <i className="bi bi-check-circle-fill me-2" />
                    {t("orderSuccess.lineLinked")}
                  </div>
                ) : linkingLine ? (
                  <p className="mb-0 text-muted">{t("common.loading")}</p>
                ) : (
                  <>
                    <p className="small text-muted mb-2">{t("orderSuccess.lineHint")}</p>
                    <a
                      href={getLineLoginUrl(order.id)}
                      className="btn btn-success"
                    >
                      <i className="bi bi-chat-dots-fill me-2" />
                      {t("orderSuccess.lineLogin")}
                    </a>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="text-center d-flex justify-content-center gap-3">
            <NavLink className="btn btn-outline-primary" to="/order-status">
              {t("orderSuccess.checkStatus")}
            </NavLink>
            <NavLink className="btn btn-primary" to="/products">
              {t("orderSuccess.continueShopping")}
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;
