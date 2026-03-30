import { useState } from "react";
import { useTranslation } from "react-i18next";

import { api, localizedName } from "../utils/api";
import { currency } from "../utils/currency";
import useMessage from "../hooks/useMessage";

function OrderModal({ modalType, tempOrder, closeModal, fetchOrders }) {
  const { showSuccess, showError } = useMessage();
  const { t } = useTranslation();

  const [isPaid, setIsPaid] = useState(!!tempOrder.isPaid);
  const [prevOrderId, setPrevOrderId] = useState(tempOrder.id);
  if (prevOrderId !== tempOrder.id) {
    setPrevOrderId(tempOrder.id);
    setIsPaid(!!tempOrder.isPaid);
  }

  const formatDate = (isoStr) => {
    if (!isoStr) return "-";
    return new Date(isoStr).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const updateOrder = async () => {
    try {
      await api.put(`/api/v1/admin/orders/${tempOrder.id}`, { isPaid });
      fetchOrders();
      closeModal();
      showSuccess(t("api.updateOrderSuccess"));
    } catch (error) {
      showError(error.response?.data?.error || error.message);
    }
  };

  const deleteOrder = async () => {
    try {
      await api.delete(`/api/v1/admin/orders/${tempOrder.id}`);
      fetchOrders();
      closeModal();
      showSuccess(t("api.deleteOrderSuccess"));
    } catch (error) {
      showError(error.response?.data?.error || error.message);
    }
  };

  const orderItems = tempOrder.items || [];

  return (
    <div
      id="orderModal"
      className="modal fade"
      tabIndex="-1"
      aria-labelledby="orderModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content border-0">
          <div
            className={`modal-header bg-${modalType === "delete" ? "danger" : "dark"} text-white`}
          >
            <h5 id="orderModalLabel" className="modal-title">
              {modalType === "delete"
                ? t("orderModal.deleteTitle")
                : t("orderModal.viewTitle")}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              data-bs-dismiss="modal"
            />
          </div>
          <div className="modal-body">
            {modalType === "delete" ? (
              <p className="fs-4">
                {t("orderModal.deleteConfirm")}{" "}
                <span className="text-danger">{tempOrder.id}</span>{" "}
                {t("orderModal.deleteConfirmSuffix")}
              </p>
            ) : (
              <>
                {/* Order info */}
                <div className="mb-3">
                  <h6>{t("orderModal.orderInfo")}</h6>
                  <table className="table table-borderless table-sm">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: "120px" }}>
                          {t("orderModal.orderId")}
                        </td>
                        <td
                          className="text-start"
                          style={{ wordBreak: "break-all" }}
                        >
                          {tempOrder.id}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">
                          {t("orderModal.createdAt")}
                        </td>
                        <td className="text-start">
                          {formatDate(tempOrder.createAt)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <hr />

                {/* Customer info */}
                <div className="mb-3">
                  <h6>{t("orderModal.customerInfo")}</h6>
                  <table className="table table-borderless table-sm">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: "120px" }}>
                          Email
                        </td>
                        <td className="text-start">{tempOrder.email}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t("orderModal.name")}</td>
                        <td className="text-start">{tempOrder.name}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">
                          {t("orderModal.phone")}
                        </td>
                        <td className="text-start">{tempOrder.phone}</td>
                      </tr>
                      {tempOrder.deliveryMethodId && (
                        <tr>
                          <td className="text-muted">
                            {t("cart.deliveryMethod")}
                          </td>
                          <td className="text-start">
                            {tempOrder.deliveryMethodName
                              ? localizedName(tempOrder.deliveryMethodName)
                              : tempOrder.deliveryMethodId
                                  .replace("delivery-", "")
                                  .replace(/_/g, " ")}
                          </td>
                        </tr>
                      )}
                      {tempOrder.storeBrand ? (
                        <tr>
                          <td className="text-muted">
                            {t("orderModal.store")}
                          </td>
                          <td className="text-start">
                            {tempOrder.storeBrandName
                              ? localizedName(tempOrder.storeBrandName)
                              : tempOrder.storeBrand} — {tempOrder.storeName} ({tempOrder.storeNumber})
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td className="text-muted">
                            {t("orderModal.address")}
                          </td>
                          <td className="text-start">
                            {tempOrder.city && tempOrder.district
                              ? `${tempOrder.city}${tempOrder.district} ${tempOrder.address}`
                              : tempOrder.city
                                ? `${tempOrder.city} ${tempOrder.address}`
                                : tempOrder.address || "—"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {tempOrder.message && (
                  <>
                    <hr />
                    <div className="mb-3">
                      <h6>{t("orderModal.message")}</h6>
                      <p>{tempOrder.message}</p>
                    </div>
                  </>
                )}

                <hr />

                {/* Products */}
                <div className="mb-3">
                  <h6>{t("orderModal.products")}</h6>
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>{t("orderModal.productName")}</th>
                        <th>{t("common.size")}</th>
                        <th style={{ width: "80px" }}>
                          {t("orderModal.qty")}
                        </th>
                        <th style={{ width: "120px" }} className="text-end">
                          {t("orderModal.subtotal")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item) => (
                        <tr key={item.id}>
                          <td>{localizedName(item.productName)}</td>
                          <td>{localizedName(item.sizeName)}</td>
                          <td>{item.qty}</td>
                          <td className="text-end">
                            NT$ {currency(Number(item.price) * item.qty)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="text-end">
                          {t("cart.subtotal")}
                        </td>
                        <td className="text-end">
                          NT$ {currency(Number(tempOrder.total))}
                        </td>
                      </tr>
                      {Number(tempOrder.shippingFee) > 0 && (
                        <tr>
                          <td colSpan="3" className="text-end">
                            {t("cart.shippingFee")}
                          </td>
                          <td className="text-end">
                            NT${" "}
                            {currency(Number(tempOrder.shippingFee))}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan="3" className="text-end fw-bold">
                          {t("orderModal.total")}
                        </td>
                        <td className="text-end fw-bold">
                          NT${" "}
                          {currency(
                            Number(tempOrder.total) +
                              Number(tempOrder.shippingFee || 0),
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <hr />

                {/* Pay status toggle */}
                <div className="mb-3">
                  <h6>{t("orderModal.payStatus")}</h6>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="isPaid"
                      checked={isPaid}
                      onChange={(e) => setIsPaid(e.target.checked)}
                    />
                    <label
                      className={`form-check-label ${isPaid ? "text-success" : "text-danger"}`}
                      htmlFor="isPaid"
                    >
                      {isPaid
                        ? t("orderModal.paid")
                        : t("orderModal.unpaid")}
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            {modalType === "delete" ? (
              <>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  data-bs-dismiss="modal"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={deleteOrder}
                >
                  {t("orderModal.confirmDelete")}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  data-bs-dismiss="modal"
                >
                  {t("common.close")}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={updateOrder}
                >
                  {t("orderModal.save")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderModal;
