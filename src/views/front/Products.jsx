import axios from "axios";
const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import Pagination from "../../components/Pagination.jsx";
import useMessage from "../../hooks/useMessage.jsx";

const fetchProducts = async (page = 1, category = "") => {
  const url = `${API_BASE}/api/${API_PATH}/products?page=${page}${category ? `&category=${category}` : ""}`;
  const res = await axios.get(url);
  return res.data;
};

const fetchAllCategories = async () => {
  const res = await axios.get(`${API_BASE}/api/${API_PATH}/products/all`);
  return [...new Set(res.data.products.map((p) => p.category))];
};

function Products() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    has_pre: false,
    has_next: false,
  });
  const [categories, setCategories] = useState([]);
  const [currentCategory, setCurrentCategory] = useState("");
  const { showSuccess, showError } = useMessage();

  useEffect(() => {
    const init = async () => {
      try {
        const [productData, categoryList] = await Promise.all([
          fetchProducts(),
          fetchAllCategories(),
        ]);
        setProducts(productData.products);
        setPagination(productData.pagination);
        setCategories(categoryList);
      } catch (error) {
        showError(error.response.data.message);
      }
    };
    init();
  }, [showError]);

  const getProducts = async (page = 1, category = currentCategory) => {
    try {
      const data = await fetchProducts(page, category);
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (error) {
      console.error(error.response);
    }
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setCurrentCategory(category);
    getProducts(1, category);
  };

  const goSingleProduct = (id) => {
    navigate(`/product/${id}`);
  };

  const addCart = async (id, qty = 1) => {
    const data = { product_id: id, qty };
    try {
      const url = `${API_BASE}/api/${API_PATH}/cart`;
      await axios.post(url, { data });
      showSuccess(t("api.addCartSuccess"));
    } catch (error) {
      showError(error.response.data.message);
    }
  };

  return (
    <div className="container">
      <div className="mt-4">
        <select
          className="form-select"
          style={{ width: "200px" }}
          value={currentCategory}
          onChange={handleCategoryChange}
        >
          <option value="">{t("products.allCategories")}</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="row mt-4">
        {products.map((product) => (
          <div className="col-md-4 mb-3" key={product.id}>
            <div className="card h-100">
              <img
                src={product.imageUrl}
                className="card-img-top"
                alt={product.title}
                style={{ height: "200px", objectFit: "cover" }}
              />
              <div className="card-body">
                <h5 className="card-title">{product.title}</h5>
                <p className="card-text">{product.content}</p>
                <div
                  className="btn-group btn-group-sm w-100"
                  role="group"
                  aria-label="Small button group"
                >
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => goSingleProduct(product.id)}
                  >
                    {t("products.viewDetail")}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => addCart(product.id)}
                  >
                    {t("common.addToCart")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        <Pagination
          pagination={pagination}
          onChangePage={(page) => getProducts(page)}
        />
      </div>
    </div>
  );
}

export default Products;
