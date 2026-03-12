import { useState } from "react";
import { useTranslation } from "react-i18next";

import axios from "axios";
const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

import { currency } from "../utils/currency";
import useMessage from "../hooks/useMessage";

function OrderModal({ modalType, tempOrder, closeModal, fetchOrders }) {
  const { showSuccess, showError } = useMessage();
  const { t } = useTranslation();
  const [isPaid, setIsPaid] = useState(!!tempOrder.is_paid);
  // render-time adjustment: sync isPaid when a different order is opened
  const [prevOrderId, setPrevOrderId] = useState(tempOrder.id);
  if (prevOrderId !== tempOrder.id) {
    setPrevOrderId(tempOrder.id);
    setIsPaid(!!tempOrder.is_paid);
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const updateOrder = async () => {
    try {
      await axios.put(
        `${API_BASE}/api/${API_PATH}/admin/order/${tempOrder.id}`,
        { data: { ...tempOrder, is_paid: isPaid } },
      );
      fetchOrders();
      closeModal();
      showSuccess(t("api.updateOrderSuccess"));
    } catch (error) {
      showError(error.response.data.message);
    }
  };

  const deleteOrder = async () => {
    try {
      await axios.delete(
        `${API_BASE}/api/${API_PATH}/admin/order/${tempOrder.id}`,
      );
      fetchOrders();
      closeModal();
      showSuccess(t("api.deleteOrderSuccess"));
    } catch (error) {
      showError(error.response.data.message);
    }
  };

  const products = tempOrder.products ? Object.values(tempOrder.products) : [];

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
              aria-label="Close"
            ></button>
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
                          {formatDate(tempOrder.create_at)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <hr />
                <div className="mb-3">
                  <h6>{t("orderModal.customerInfo")}</h6>
                  <table className="table table-borderless table-sm">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: "120px" }}>
                          Email
                        </td>
                        <td className="text-start">{tempOrder.user?.email}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t("orderModal.name")}</td>
                        <td className="text-start">{tempOrder.user?.name}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t("orderModal.phone")}</td>
                        <td className="text-start">{tempOrder.user?.tel}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">
                          {t("orderModal.address")}
                        </td>
                        <td className="text-start">
                          {tempOrder.user?.address}
                        </td>
                      </tr>
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
                <div className="mb-3">
                  <h6>{t("orderModal.products")}</h6>
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>{t("orderModal.productName")}</th>
                        <th style={{ width: "80px" }}>{t("orderModal.qty")}</th>
                        <th style={{ width: "120px" }} className="text-end">
                          {t("orderModal.subtotal")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((item) => (
                        <tr key={item.id}>
                          <td>{item.product?.title}</td>
                          <td>{item.qty}</td>
                          <td className="text-end">
                            NT$ {currency(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="2" className="text-end fw-bold">
                          {t("orderModal.total")}
                        </td>
                        <td className="text-end fw-bold">
                          NT$ {currency(tempOrder.total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <hr />
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
                      {isPaid ? t("orderModal.paid") : t("orderModal.unpaid")}
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
