import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import * as bootstrap from "bootstrap";
import { useTranslation } from "react-i18next";

import "../../assets/scss/all.scss";

import axios from "axios";
const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

import ProductModal from "../../components/ProductModal";
import Pagination from "../../components/Pagination";
import { currency } from "../../utils/currency";
import useMessage from "../../hooks/useMessage";

const INITIAL_TEMPLATE_DATA = {
  id: "",
  title: "",
  category: "",
  origin_price: "",
  price: "",
  unit: "",
  description: "",
  content: "",
  is_enabled: false,
  imageUrl: "",
  imagesUrl: [],
  shipping: [],
};

function AdminProducts() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [products, setProducts] = useState([]);
  const [templateProduct, setTemplateProduct] = useState(INITIAL_TEMPLATE_DATA);
  const [modalType, setModalType] = useState("");
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    has_pre: false,
    has_next: false,
  });
  const { showError } = useMessage();

  const fetchProducts = async (page = 1) => {
    const res = await axios.get(
      `${API_BASE}/api/${API_PATH}/admin/products?page=${page}`,
    );
    setProducts(res.data.products);
    setPagination(res.data.pagination);
    return res.data;
  };

  const productModalRef = useRef(null);

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("hexW2Token="))
      ?.split("=")[1];
    if (token) {
      axios.defaults.headers.common["Authorization"] = token;
    }

    productModalRef.current = new bootstrap.Modal("#productModal", {
      keyboard: false,
    });

    document
      .querySelector("#productModal")
      .addEventListener("hide.bs.modal", () => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      });
  }, [navigate]);

  useEffect(() => {
    const init = async () => {
      try {
        await fetchProducts();
      } catch (error) {
        showError(error.response.data.message);
      }
    };
    init();
  }, [showError]);

  const openModal = (type, product) => {
    setModalType(type);
    if (type === "create") {
      setTemplateProduct(INITIAL_TEMPLATE_DATA);
    } else {
      setTemplateProduct(product);
    }
    setTimeout(() => {
      productModalRef.current.show();
    }, 0);
  };

  const closeModal = () => {
    productModalRef.current.hide();
  };

  return (
    <>
      <div className="container">
        <div className="text-end mt-4">
          <button
            className="btn btn-primary"
            onClick={() => openModal("create", INITIAL_TEMPLATE_DATA)}
          >
            {t("admin.products.create")}
          </button>
        </div>
        <h2>{t("admin.products.title")}</h2>
        <table className="table mt-4">
          <thead>
            <tr>
              <th>{t("admin.products.category")}</th>
              <th>{t("admin.products.name")}</th>
              <th>{t("admin.products.originPrice")}</th>
              <th>{t("admin.products.price")}</th>
              <th>{t("admin.products.status")}</th>
              <th>{t("admin.products.action")}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.category}</td>
                <td>{product.title}</td>
                <td>{currency(product.origin_price)}</td>
                <td>{currency(product.price)}</td>
                <td className={product.is_enabled ? "text-success" : ""}>
                  {product.is_enabled
                    ? t("admin.products.enabled")
                    : t("admin.products.disabled")}
                </td>
                <td>
                  <div className="btn-group" role="group">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => openModal("edit", product)}
                    >
                      {t("admin.products.edit")}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => openModal("delete", product)}
                    >
                      {t("admin.products.delete")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination pagination={pagination} onChangePage={fetchProducts} />

      <ProductModal
        getProducts={fetchProducts}
        modalType={modalType}
        templateProduct={templateProduct}
        closeModal={closeModal}
      />
    </>
  );
}

export default AdminProducts;
