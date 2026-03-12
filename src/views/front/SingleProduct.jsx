import axios from "axios";
const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

import { currency } from "../../utils/currency";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import useMessage from "../../hooks/useMessage.jsx";

function SingleProduct() {
  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [qty, setQty] = useState(1);
  const { id } = useParams();
  const { t } = useTranslation();
  const { showSuccess, showError } = useMessage();

  useEffect(() => {
    const getProduct = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/${API_PATH}/product/${id}`,
        );
        setProduct(res.data.product);
        setMainImage(res.data.product.imageUrl);
      } catch (error) {
        console.error(error);
        showError(error.response.data.message);
      }
    };
    getProduct();
  }, [id, showSuccess, showError]);

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

  if (!product)
    return <p className="text-center fs-2 mt-5">{t("common.loading")}</p>;

  return (
    <div className="container mt-5">
      <div className="row">
        {/* 左側圖片區 */}
        <div className="col-md-6">
          <img
            src={mainImage}
            alt={product.title}
            className="img-fluid mb-3"
            style={{ width: "100%", height: "400px", objectFit: "cover" }}
          />
          {product.imagesUrl?.length > 0 && (
            <div className="d-flex gap-2 flex-wrap">
              {[product.imageUrl, ...product.imagesUrl]
                .filter((url) => url)
                .map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`${product.title} ${index + 1}`}
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "cover",
                      cursor: "pointer",
                      border:
                        mainImage === img
                          ? "2px solid #198754"
                          : "2px solid transparent",
                    }}
                    onClick={() => setMainImage(img)}
                  />
                ))}
            </div>
          )}
        </div>

        {/* 右側產品資訊 */}
        <div className="col-md-6 text-start">
          <span className="badge bg-primary mb-2">{product.category}</span>
          <h2>{product.title}</h2>
          <p className="text-muted">{product.content}</p>
          <p>{product.description}</p>
          <div className="mb-3">
            {product.origin_price !== product.price && (
              <del className="text-muted me-2">
                NT$ {currency(product.origin_price)}
              </del>
            )}
            <span className="fs-4 fw-bold text-danger">
              NT$ {currency(product.price)}
            </span>
            <small className="text-muted ms-2">/ {product.unit}</small>
          </div>

          <div className="d-flex align-items-center gap-3 mb-3">
            <div className="input-group" style={{ width: "150px" }}>
              <button
                className="btn btn-outline-primary"
                type="button"
                onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                disabled={qty <= 1}
              >
                -
              </button>
              <input
                type="number"
                className="form-control text-center"
                value={qty}
                min={1}
                max={20}
                readOnly
              />
              <button
                className="btn btn-outline-primary"
                type="button"
                onClick={() => setQty((prev) => Math.min(10, prev + 1))}
                disabled={qty >= 10}
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary w-100"
            onClick={() => addCart(product.id, qty)}
          >
            {t("common.addToCart")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SingleProduct;
