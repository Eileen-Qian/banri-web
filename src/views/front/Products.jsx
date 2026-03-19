import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import {
  api,
  localizedName,
  primaryImageUrl,
  priceRange,
  cartHeaders,
} from "../../utils/api";
import Pagination from "../../components/Pagination.jsx";
import { currency } from "../../utils/currency.jsx";
import useMessage from "../../hooks/useMessage.jsx";

function Products() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [categories, setCategories] = useState([]);
  const [currentCategory, setCurrentCategory] = useState("");
  const { showSuccess, showError } = useMessage();

  const fetchProducts = useCallback(async (page = 1, categoryId = "") => {
    const params = new URLSearchParams({ page: String(page) });
    if (categoryId) params.set("categoryId", categoryId);

    const res = await api.get(`/api/v1/products?${params}`);
    setProducts(res.data.items);
    setPagination(res.data.pagination);
    if (res.data.categories) setCategories(res.data.categories);
    return res.data;
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await fetchProducts();
      } catch (error) {
        showError(error.response?.data?.error || error.message);
      }
    };
    init();
  }, [fetchProducts, showError]);

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setCurrentCategory(categoryId);
    fetchProducts(1, categoryId);
  };

  const addCart = async (product) => {
    const variant = product.variants?.[0];
    if (!variant) return;
    try {
      await api.post(
        "/api/v1/cart/items",
        { variantId: variant.id, qty: 1 },
        { headers: cartHeaders() },
      );
      showSuccess(t("api.addCartSuccess"));
    } catch (error) {
      showError(error.response?.data?.error || error.message);
    }
  };

  return (
    <div className="container py-4">
      {/* Filter bar */}
      <div className="mb-4">
        <select
          className="form-select"
          style={{ width: "220px" }}
          value={currentCategory}
          onChange={handleCategoryChange}
        >
          <option value="">{t("products.allCategories")}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {localizedName(cat.name)}
            </option>
          ))}
        </select>
      </div>

      {/* Product grid */}
      <div className="product-grid">
        {products.map((product) => {
          const imgUrl = primaryImageUrl(product.images);
          const range = priceRange(product.variants);
          const catName = localizedName(product.category?.name);
          const name = localizedName(product.name);

          return (
            <div className="product-card" key={product.id}>
              <div className="product-card__img-wrap">
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    className="product-card__img"
                    alt={name}
                  />
                ) : (
                  <div className="product-card__no-img">
                    <i className="bi bi-image" />
                  </div>
                )}
                {catName && (
                  <span className="product-card__category">
                    <i className="bi bi-tag-fill" />
                    {catName}
                  </span>
                )}
              </div>

              <div className="product-card__body">
                <p className="product-card__name">{name}</p>
                {product.scientificName && (
                  <p className="product-card__latin">
                    {product.scientificName}
                  </p>
                )}
                <p className="product-card__price">
                  {range.min === range.max
                    ? `NT$ ${currency(range.min)}`
                    : `NT$ ${currency(range.min)} ~ ${currency(range.max)}`}
                </p>
                <div className="product-card__actions">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    {t("products.viewDetail")}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      addCart(product);
                    }}
                  >
                    {t("common.addToCart")}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <Pagination
          pagination={pagination}
          onChangePage={(page) => fetchProducts(page, currentCategory)}
        />
      </div>
    </div>
  );
}

export default Products;
