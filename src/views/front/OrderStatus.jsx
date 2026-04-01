import { useState } from "react";
import { NavLink } from "react-router";
import { useForm } from "react-hook-form";
import { ThreeDots } from "react-loader-spinner";
import { useTranslation } from "react-i18next";

import { api, localizedName } from "../../utils/api";
import { currency } from "../../utils/currency";
import { emailValidation } from "../../utils/validation";

function paymentStatus(order) {
  if (order.isPaid) return { key: "statusPaid", badge: "bg-success" };
  if (order.paymentNotifiedAt) return { key: "statusVerifying", badge: "bg-warning text-dark" };
  return { key: "statusPending", badge: "bg-secondary" };
}

function OrderStatus() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState(null); // list view
  const [singleOrder, setSingleOrder] = useState(null); // detail view
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({ mode: "onSubmit", defaultValues: { email: "", orderId: "" } });

  const onSubmit = async (data) => {
    setLoading(true);
    setNotFound(false);
    setOrders(null);
    setSingleOrder(null);
    try {
      const body = { email: data.email.trim() };
      if (data.orderId.trim()) body.orderId = data.orderId.trim();

      const res = await api.post("/api/v1/orders/lookup", body);

      if (res.data.type === "single") {
        setSingleOrder(res.data.order);
      } else {
        setOrders(res.data.orders);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // Click an order in the list to expand detail
  const handleSelectOrder = (order) => {
    setSingleOrder(order);
  };

  const handleBackToList = () => {
    setSingleOrder(null);
  };

  return (
    <div className="container mt-5 mb-5">
      <h2 className="mb-2">{t("orderStatus.title")}</h2>
      <p className="text-muted mb-4">{t("orderStatus.subtitle")}</p>

      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          {/* Lookup form */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    {t("orderStatus.emailLabel")}
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="form-control"
                    placeholder={t("orderStatus.emailPlaceholder")}
                    {...register("email", emailValidation(t))}
                  />
                  {errors.email && (
                    <p className="text-danger mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="orderId" className="form-label">
                    {t("orderStatus.orderIdLabel")}
                    <small className="text-muted ms-2">
                      {t("orderStatus.optional")}
                    </small>
                  </label>
                  <input
                    id="orderId"
                    type="text"
                    className="form-control"
                    placeholder={t("orderStatus.orderIdPlaceholder")}
                    {...register("orderId")}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <ThreeDots
                      visible
                      height="24"
                      width="60"
                      color="#fff"
                      radius="9"
                      wrapperStyle={{ display: "flex", justifyContent: "center" }}
                    />
                  ) : (
                    t("orderStatus.search")
                  )}
                </button>
              </form>

              {notFound && (
                <div className="alert alert-warning mt-3 mb-0">
                  <i className="bi bi-exclamation-triangle me-2" />
                  {t("orderStatus.notFound")}
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          {singleOrder && (
            <>
              {orders && (
                <button
                  className="btn btn-outline-secondary btn-sm mb-3"
                  onClick={handleBackToList}
                >
                  <i className="bi bi-arrow-left me-1" />
                  {t("orderStatus.backToList")}
                </button>
              )}
              <OrderDetail t={t} order={singleOrder} email={getValues("email")} onUpdate={setSingleOrder} />
            </>
          )}

          {orders && !singleOrder && (
            <OrderList
              t={t}
              orders={orders}
              onSelect={handleSelectOrder}
            />
          )}

          {/* Back link */}
          {!orders && !singleOrder && (
            <div className="text-center">
              <NavLink className="btn btn-outline-primary" to="/products">
                {t("common.goShopping")}
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Order List ─────────────────────────────────────────────────────────── */

function OrderList({ t, orders, onSelect }) {
  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body p-4">
        <h6 className="fw-bold mb-3">
          {t("orderStatus.resultCount", { count: orders.length })}
        </h6>
        <div className="list-group list-group-flush">
          {orders.map((order) => {
            const subtotal = Number(order.total);
            const methodName = order.deliveryMethodName
              ? localizedName(order.deliveryMethodName)
              : "";
            return (
              <button
                key={order.id}
                className="list-group-item list-group-item-action px-0 py-3"
                onClick={() => onSelect(order)}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="fw-semibold">
                      {order.orderNumber || order.id}
                    </div>
                    <small className="text-muted">
                      {formatDate(order.createAt)}
                      {methodName && ` · ${methodName}`}
                      {` · ${order.items.length} `}{t("orderStatus.itemUnit")}
                    </small>
                  </div>
                  <div className="text-end ms-3 flex-shrink-0">
                    <div className="fw-bold">NT$ {currency(subtotal)}</div>
                    <span
                      className={`badge ${paymentStatus(order).badge}`}
                    >
                      {t(`orderStatus.${paymentStatus(order).key}`)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Single Order Detail ────────────────────────────────────────────────── */

function OrderDetail({ t, order, email, onUpdate }) {
  const [lastFive, setLastFive] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!order.paymentNotifiedAt);

  const handlePaymentNotify = async () => {
    if (!/^\d{5}$/.test(lastFive) || !amount) return;
    setSubmitting(true);
    try {
      await api.put(`/api/v1/orders/${order.id}/payment-notify`, {
        email,
        lastFive,
        amount: Number(amount),
      });
      setSubmitted(true);
      onUpdate?.({ ...order, paymentLastFive: lastFive, paymentAmount: amount, paymentNotifiedAt: new Date().toISOString() });
    } catch {
      // error handled silently
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal = Number(order.total);

  const methodName = order.deliveryMethodName
    ? localizedName(order.deliveryMethodName)
    : order.deliveryMethodId?.replace("delivery-", "").replace(/_/g, " ");

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Status + order info */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <small className="text-muted">{t("orderStatus.orderId")}</small>
              <div className="fw-bold">
                {order.orderNumber || order.id}
              </div>
            </div>
            <span
              className={`badge fs-6 ${paymentStatus(order).badge}`}
            >
              {t(`orderStatus.${paymentStatus(order).key}`)}
            </span>
          </div>

          <div className="row g-3">
            <div className="col-6">
              <small className="text-muted">{t("orderStatus.recipient")}</small>
              <div>{order.name}</div>
            </div>
            <div className="col-6">
              <small className="text-muted">{t("orderStatus.deliveryMethod")}</small>
              <div>{methodName}</div>
            </div>
            <div className="col-6">
              <small className="text-muted">{t("orderStatus.orderDate")}</small>
              <div>{formatDate(order.createAt)}</div>
            </div>
            {order.city && (
              <div className="col-6">
                <small className="text-muted">{t("orderStatus.address")}</small>
                <div>{order.city}{order.district}</div>
              </div>
            )}
            {order.storeName && (
              <div className="col-6">
                <small className="text-muted">{t("orderStatus.pickupStore")}</small>
                <div>{order.storeBrand} — {order.storeName}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h6 className="fw-bold mb-3">{t("orderStatus.items")}</h6>
          {order.items.map((item) => (
            <div
              key={item.id}
              className="d-flex justify-content-between align-items-center mb-2"
            >
              <div>
                <span>{localizedName(item.productName)}</span>
                <small className="text-muted ms-2">
                  {localizedName(item.sizeName)}
                </small>
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

      {/* Payment notify form */}
      {!order.isPaid && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-cash-stack me-2" />
              {t("orderStatus.paymentNotify")}
            </h6>
            {submitted ? (
              <div className="text-success">
                <i className="bi bi-check-circle me-1" />
                {t("orderStatus.paymentAlready")}
                {order.paymentLastFive && (
                  <span className="text-muted ms-2">
                    ({t("orderStatus.paymentLastFive")}: {order.paymentLastFive})
                  </span>
                )}
              </div>
            ) : (
              <>
                <p className="text-muted small mb-3">{t("orderStatus.paymentNotifyHint")}</p>
                <div className="row g-2 align-items-end">
                  <div className="col-5">
                    <label className="form-label small mb-1">{t("orderStatus.paymentLastFive")}</label>
                    <input
                      type="text"
                      className="form-control"
                      maxLength={5}
                      pattern="\d{5}"
                      placeholder={t("orderStatus.paymentLastFivePlaceholder")}
                      value={lastFive}
                      onChange={(e) => setLastFive(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    />
                  </div>
                  <div className="col-5">
                    <label className="form-label small mb-1">{t("orderStatus.paymentAmount")}</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder={t("orderStatus.paymentAmountPlaceholder")}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="col-2">
                    <button
                      className="btn btn-primary w-100"
                      disabled={lastFive.length !== 5 || !amount || submitting}
                      onClick={handlePaymentNotify}
                    >
                      {submitting ? "..." : t("orderStatus.paymentSubmit")}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pending payment hint */}
      {!order.isPaid && (
        <div
          className="card border-0 shadow-sm mb-4"
          style={{ background: "var(--bs-primary-bg-subtle, #e7f5ff)" }}
        >
          <div className="card-body p-4">
            <h6 className="fw-bold mb-2">
              <i className="bi bi-info-circle me-2" />
              {t("orderStatus.pendingTitle")}
            </h6>
            <p className="mb-0">{t("orderStatus.pendingHint")}</p>
          </div>
        </div>
      )}

      <div className="text-center">
        <NavLink className="btn btn-primary" to="/products">
          {t("orderSuccess.continueShopping")}
        </NavLink>
      </div>
    </>
  );
}

export default OrderStatus;
