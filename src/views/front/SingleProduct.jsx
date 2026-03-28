import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";

import {
  api,
  localizedName,
  primaryImageUrl,
  priceRange,
  cartHeaders,
} from "../../utils/api";
import { currency } from "../../utils/currency";
import useMessage from "../../hooks/useMessage.jsx";

function SingleProduct() {
  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [qty, setQty] = useState(1);
  const { id } = useParams();
  const { t } = useTranslation();
  const { showSuccess, showError } = useMessage();

  useEffect(() => {
    const getProduct = async () => {
      try {
        const res = await api.get(`/api/v1/products/${id}`);
        const data = res.data;
        setProduct(data);
        setMainImage(primaryImageUrl(data.images));
        if (data.variants?.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      } catch (error) {
        console.error(error);
        showError(error.response?.data?.error || error.message);
      }
    };
    getProduct();
  }, [id, showError]);

  const addCart = async () => {
    if (!selectedVariant) return;
    try {
      await api.post(
        "/api/v1/cart/items",
        { variantId: selectedVariant.id, qty },
        { headers: cartHeaders() },
      );
      showSuccess(t("api.addCartSuccess"));
    } catch (error) {
      showError(error.response?.data?.error || error.message);
    }
  };

  if (!product)
    return (
      <div className="container mt-5" aria-hidden="true">
        <div className="row">
          <div className="col-md-6">
            <div
              className="placeholder-glow bg-secondary bg-opacity-25 rounded mb-3"
              style={{ width: "100%", height: "400px" }}
            />
            <div className="d-flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="placeholder-glow bg-secondary bg-opacity-25"
                  style={{ width: "80px", height: "80px" }}
                />
              ))}
            </div>
          </div>
          <div className="col-md-6 text-start placeholder-glow">
            <span
              className="badge placeholder col-2 mb-2"
              style={{ height: "22px" }}
            />
            <h2>
              <span className="placeholder col-5" />
            </h2>
            <p>
              <span className="placeholder col-7" />
            </p>
            <p>
              <span className="placeholder col-12" />
              <span className="placeholder col-10" />
              <span className="placeholder col-8" />
            </p>
            <div className="mb-3">
              <span className="placeholder col-3 fs-4" />
            </div>
            <span className="btn btn-primary disabled placeholder col-12" />
          </div>
        </div>
      </div>
    );

  const allImages = product.images || [];
  const range = priceRange(product.variants);

  return (
    <div className="container mt-5">
      <div className="row">
        {/* 左側圖片區 */}
        <div className="col-md-6">
          {mainImage && (
            <img
              src={mainImage}
              alt={localizedName(product.name)}
              className="img-fluid mb-3"
              style={{ width: "100%", height: "400px", objectFit: "cover" }}
            />
          )}
          {allImages.length > 1 && (
            <div className="d-flex gap-2 flex-wrap">
              {allImages.map((img) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt={localizedName(product.name)}
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    cursor: "pointer",
                    border:
                      mainImage === img.url
                        ? "2px solid var(--bs-primary)"
                        : "2px solid transparent",
                  }}
                  onClick={() => setMainImage(img.url)}
                />
              ))}
            </div>
          )}
        </div>

        {/* 右側產品資訊 */}
        <div className="col-md-6 text-start">
          {product.category && (
            <span className="badge bg-primary mb-2">
              {localizedName(product.category.name)}
            </span>
          )}
          <h2>{localizedName(product.name)}</h2>
          {product.scientificName && (
            <p className="text-muted fst-italic">{product.scientificName}</p>
          )}
          {product.description && (
            <p style={{ whiteSpace: "pre-line" }}>
              {localizedName(product.description)}
            </p>
          )}

          {/* 規格選擇 */}
          {product.variants?.length > 0 && (
            <div className="mb-3">
              <label className="form-label fw-bold">{t("common.size")}</label>
              <div className="d-flex gap-2 flex-wrap">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className={`btn btn-sm ${
                      selectedVariant?.id === v.id
                        ? "btn-primary"
                        : "btn-outline-primary"
                    }`}
                    onClick={() => setSelectedVariant(v)}
                  >
                    {localizedName(v.size?.name)}
                    {v.heightMin && v.heightMax
                      ? ` (${v.heightMin}-${v.heightMax}cm)`
                      : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-3">
            <span className="fs-4 fw-bold text-danger">
              NT${" "}
              {currency(
                selectedVariant ? Number(selectedVariant.price) : range.min,
              )}
            </span>
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
                max={10}
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
            onClick={addCart}
          >
            {t("common.addToCart")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SingleProduct;
