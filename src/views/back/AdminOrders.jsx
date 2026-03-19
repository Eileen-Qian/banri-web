import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import * as bootstrap from "bootstrap";
import { useTranslation } from "react-i18next";

import { api } from "../../utils/api";
import Pagination from "../../components/Pagination";
import OrderModal from "../../components/OrderModal";
import { currency } from "../../utils/currency";

function AdminOrders() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [orders, setOrders] = useState([]);
  const [tempOrder, setTempOrder] = useState({});
  const [modalType, setModalType] = useState("");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const orderModalRef = useRef(null);

  const fetchOrders = async (page = 1) => {
    const res = await api.get(`/api/v1/admin/orders?page=${page}`);
    setOrders(res.data.items);
    setPagination(res.data.pagination);
    return res.data;
  };

  useEffect(() => {
    const init = async () => {
      try {
        await fetchOrders();
      } catch (error) {
        console.error(error);
      }
    };
    init();

    orderModalRef.current = new bootstrap.Modal("#orderModal", {
      keyboard: false,
    });

    document
      .querySelector("#orderModal")
      .addEventListener("hide.bs.modal", () => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      });
  }, [navigate]);

  const openModal = (type, order) => {
    setModalType(type);
    setTempOrder({ ...order });
    setTimeout(() => orderModalRef.current.show(), 0);
  };

  const closeModal = () => orderModalRef.current.hide();

  const formatDate = (isoStr) => {
    if (!isoStr) return "-";
    return new Date(isoStr).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <>
      <div className="container">
        <h2 className="mt-4">{t("admin.orders.title")}</h2>
        <div className="table-responsive">
          <table className="table mt-4 align-middle">
            <thead>
              <tr>
                <th style={{ width: "120px" }}>
                  {t("admin.orders.orderId")}
                </th>
                <th>{t("admin.orders.email")}</th>
                <th>{t("admin.orders.name")}</th>
                <th className="text-end">{t("admin.orders.amount")}</th>
                <th className="text-center">
                  {t("admin.orders.payStatus")}
                </th>
                <th>{t("admin.orders.createdAt")}</th>
                <th style={{ width: "140px" }}>
                  {t("admin.orders.action")}
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span title={order.id}>
                      {order.id.substring(0, 8)}...
                    </span>
                  </td>
                  <td>{order.email}</td>
                  <td>{order.name}</td>
                  <td className="text-end">
                    NT$ {currency(Number(order.total))}
                  </td>
                  <td className="text-center">
                    <span
                      className={`badge ${order.isPaid ? "bg-success" : "bg-danger"}`}
                    >
                      {order.isPaid
                        ? t("admin.orders.paid")
                        : t("admin.orders.unpaid")}
                    </span>
                  </td>
                  <td>{formatDate(order.createAt)}</td>
                  <td>
                    <div className="btn-group" role="group">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => openModal("view", order)}
                      >
                        {t("admin.orders.view")}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => openModal("delete", order)}
                      >
                        {t("admin.orders.delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination pagination={pagination} onChangePage={fetchOrders} />

      <OrderModal
        modalType={modalType}
        tempOrder={tempOrder}
        closeModal={closeModal}
        fetchOrders={fetchOrders}
      />
    </>
  );
}

export default AdminOrders;
