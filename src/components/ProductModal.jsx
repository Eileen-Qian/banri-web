import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { api, localizedName } from "../utils/api";
import useMessage from "../hooks/useMessage";

function ProductModal({ getProducts, modalType, templateProduct, closeModal }) {
  const { t } = useTranslation();
  const { showSuccess, showError } = useMessage();

  // ── Reference data (categories, sizes, height estimates) ──────────────────

  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [heightEstimates, setHeightEstimates] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, sizeRes, heightRes] = await Promise.all([
          api.get("/api/v1/admin/categories"),
          api.get("/api/v1/admin/product-sizes"),
          api.get("/api/v1/admin/products/height-estimates"),
        ]);
        setCategories(catRes.data);
        setSizes(sizeRes.data);
        setHeightEstimates(heightRes.data);
      } catch {
        // reference data load failed — form will still work
      }
    };
    load();
  }, []);

  // ── Form state ────────────────────────────────────────────────────────────

  const initialState = useMemo(() => {
    const src = templateProduct || {};
    if (modalType === "create" || !src.id) {
      return {
        nameZh: "",
        nameEn: "",
        scientificName: "",
        descriptionZh: "",
        descriptionEn: "",
        categoryId: "",
        isActive: true,
        images: [],
        variants: [],
      };
    }
    return {
      nameZh: src.name?.zh || "",
      nameEn: src.name?.en || "",
      scientificName: src.scientificName || "",
      descriptionZh: src.description?.zh || "",
      descriptionEn: src.description?.en || "",
      categoryId: src.categoryId || "",
      isActive: src.isActive ?? true,
      images: (src.images || []).map((img) => ({
        id: img.id,
        fileId: img.fileId,
        url: img.url,
        isPrimary: img.isPrimary,
        order: img.order,
      })),
      variants: (src.variants || []).map((v) => ({
        id: v.id,
        sizeId: v.sizeId,
        heightMin: v.heightMin ?? "",
        heightMax: v.heightMax ?? "",
        price: v.price ? Number(v.price) : "",
      })),
    };
  }, [templateProduct, modalType]);

  const [tempData, setTempData] = useState(initialState);
  useEffect(() => setTempData(initialState), [initialState]);

  const field = (key) => (e) =>
    setTempData((prev) => ({ ...prev, [key]: e.target.value }));

  // ── Image management ──────────────────────────────────────────────────────

  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("file", f));
      const res = await api.post("/api/v1/admin/uploads/image", formData);
      const newImages = (res.data.uploaded || []).map((u, i) => ({
        fileId: u.fileId,
        url: u.url,
        isPrimary: tempData.images.length === 0 && i === 0,
        order: tempData.images.length + i,
      }));
      setTempData((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages],
      }));
      showSuccess(t("api.uploadImageSuccess"));
    } catch (err) {
      showError(err.response?.data?.error || err.message);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (index) => {
    const img = tempData.images[index];
    if (!img.id && img.fileId) {
      api.delete(`/api/v1/admin/uploads/image/${img.fileId}`).catch(() => {});
    }
    setTempData((prev) => {
      const next = prev.images.filter((_, i) => i !== index);
      if (img.isPrimary && next.length > 0) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return { ...prev, images: next };
    });
  };

  const setPrimary = (index) =>
    setTempData((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      })),
    }));

  // ── Variant management ────────────────────────────────────────────────────

  const addVariant = () =>
    setTempData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { sizeId: "", heightMin: "", heightMax: "", price: "" },
      ],
    }));

  const removeVariant = (index) =>
    setTempData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));

  const updateVariant = (index, key, value) =>
    setTempData((prev) => {
      const next = [...prev.variants];
      next[index] = { ...next[index], [key]: value };
      if (key === "sizeId" && value) {
        const est = heightEstimates.find((h) => h.sizeId === value);
        if (est && !next[index].heightMin && !next[index].heightMax) {
          next[index].heightMin = est.heightMin;
          next[index].heightMax = est.heightMax;
        }
      }
      return { ...prev, variants: next };
    });

  const usedSizeIds = new Set(
    tempData.variants.map((v) => v.sizeId).filter(Boolean),
  );

  // ── Submit / Delete ───────────────────────────────────────────────────────

  const validVariants = tempData.variants.filter(
    (v) => v.sizeId && v.price !== "" && Number(v.price) >= 0,
  );
  const canSubmit =
    tempData.nameZh && tempData.nameEn && validVariants.length > 0;

  const handleSubmit = async () => {
    if (!tempData.nameZh || !tempData.nameEn) {
      showError(t("productModal.nameRequired"));
      return;
    }
    if (validVariants.length === 0) {
      showError(t("productModal.variantRequired"));
      return;
    }
    const body = {
      name: { zh: tempData.nameZh, en: tempData.nameEn },
      scientificName: tempData.scientificName || null,
      description:
        tempData.descriptionZh || tempData.descriptionEn
          ? { zh: tempData.descriptionZh, en: tempData.descriptionEn }
          : null,
      categoryId: tempData.categoryId || null,
      isActive: tempData.isActive,
      images: tempData.images.map((img, i) => ({
        ...(img.id && { id: img.id }),
        fileId: img.fileId || null,
        url: img.url,
        isPrimary: img.isPrimary || false,
        order: i,
      })),
      variants: tempData.variants
        .filter((v) => v.sizeId)
        .map((v) => ({
          ...(v.id && { id: v.id }),
          sizeId: v.sizeId,
          heightMin: v.heightMin ? Number(v.heightMin) : null,
          heightMax: v.heightMax ? Number(v.heightMax) : null,
          price: Number(v.price) || 0,
        })),
    };

    try {
      if (modalType === "edit") {
        await api.put(`/api/v1/admin/products/${templateProduct.id}`, body);
        showSuccess(t("api.updateProductSuccess"));
      } else {
        await api.post("/api/v1/admin/products", body);
        showSuccess(t("api.createProductSuccess"));
      }
      getProducts();
      closeModal();
    } catch (err) {
      showError(err.response?.data?.error || err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/v1/admin/products/${templateProduct.id}`);
      showSuccess(t("api.deleteProductSuccess"));
      getProducts();
      closeModal();
    } catch (err) {
      showError(err.response?.data?.error || err.message);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const modalTitleKey =
    modalType === "delete"
      ? "productModal.deleteTitle"
      : modalType === "edit"
        ? "productModal.editTitle"
        : "productModal.createTitle";

  return (
    <div
      id="productModal"
      className="modal fade"
      tabIndex="-1"
      aria-labelledby="productModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-xl">
        <div className="modal-content border-0">
          {/* Header */}
          <div
            className={`modal-header bg-${modalType === "delete" ? "danger" : "dark"} text-white`}
          >
            <h5 id="productModalLabel" className="modal-title">
              {t(modalTitleKey)}
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
                {t("productModal.deleteConfirm")}{" "}
                <span className="text-danger">
                  {localizedName(templateProduct?.name)}
                </span>{" "}
                {t("productModal.deleteConfirmSuffix")}
              </p>
            ) : (
              <div className="row">
                {/* ── Left: Images ── */}
                <div className="col-sm-4">
                  <label className="form-label fw-bold">
                    {t("productModal.uploadImage")}
                  </label>
                  <input
                    type="file"
                    className="form-control mb-2"
                    accept=".jpg,.jpeg,.png,.webp,.gif"
                    multiple
                    onChange={uploadImage}
                    disabled={isUploading || tempData.images.length >= 10}
                  />
                  {isUploading && (
                    <p className="text-muted small">{t("common.loading")}</p>
                  )}

                  <div className="d-flex flex-column gap-2 mt-2">
                    {tempData.images.map((img, index) => (
                      <div
                        key={img.fileId || img.id || img.url}
                        className="position-relative border rounded p-1"
                      >
                        <img
                          src={img.url}
                          alt=""
                          className="img-fluid"
                          style={{
                            maxHeight: "120px",
                            objectFit: "cover",
                            width: "100%",
                          }}
                        />
                        <div className="d-flex gap-1 mt-1">
                          <button
                            type="button"
                            className={`btn btn-sm flex-grow-1 ${img.isPrimary ? "btn-success" : "btn-outline-secondary"}`}
                            onClick={() => setPrimary(index)}
                            disabled={img.isPrimary}
                          >
                            {img.isPrimary
                              ? t("productModal.primary")
                              : t("productModal.setPrimary")}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removeImage(index)}
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Right: Fields ── */}
                <div className="col-sm-8">
                  {/* Names */}
                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <label className="form-label">
                        {t("productModal.nameZh")}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={t("productModal.nameZhPlaceholder")}
                        value={tempData.nameZh}
                        onChange={field("nameZh")}
                      />
                    </div>
                    <div className="mb-3 col-md-6">
                      <label className="form-label">
                        {t("productModal.nameEn")}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={t("productModal.nameEnPlaceholder")}
                        value={tempData.nameEn}
                        onChange={field("nameEn")}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      {t("productModal.scientificName")}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={t("productModal.scientificNamePlaceholder")}
                      value={tempData.scientificName}
                      onChange={field("scientificName")}
                    />
                  </div>

                  {/* Category + isActive */}
                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <label className="form-label">
                        {t("productModal.category")}
                      </label>
                      <select
                        className="form-select"
                        value={tempData.categoryId}
                        onChange={field("categoryId")}
                      >
                        <option value="">{t("productModal.noCategory")}</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {localizedName(cat.name)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3 col-md-6 d-flex align-items-end pb-1">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="isActive"
                          checked={tempData.isActive}
                          onChange={(e) =>
                            setTempData((prev) => ({
                              ...prev,
                              isActive: e.target.checked,
                            }))
                          }
                        />
                        <label className="form-check-label" htmlFor="isActive">
                          {t("productModal.isEnabled")}
                        </label>
                      </div>
                    </div>
                  </div>

                  <hr />

                  <div className="mb-3">
                    <label className="form-label">
                      {t("productModal.descriptionZh")}
                    </label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder={t("productModal.descriptionZhPlaceholder")}
                      value={tempData.descriptionZh}
                      onChange={field("descriptionZh")}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      {t("productModal.descriptionEn")}
                    </label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder={t("productModal.descriptionEnPlaceholder")}
                      value={tempData.descriptionEn}
                      onChange={field("descriptionEn")}
                    />
                  </div>

                  <hr />

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label fw-bold mb-0">
                        {t("productModal.variants")}
                      </label>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={addVariant}
                      >
                        <i className="bi bi-plus me-1" />
                        {t("productModal.addVariant")}
                      </button>
                    </div>

                    {tempData.variants.length > 0 && (
                      <div className="table-responsive">
                        <table className="table table-sm align-middle">
                          <thead>
                            <tr>
                              <th>{t("productModal.size")}</th>
                              <th>{t("productModal.heightMin")}</th>
                              <th>{t("productModal.heightMax")}</th>
                              <th>{t("productModal.variantPrice")}</th>
                              <th style={{ width: "50px" }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {tempData.variants.map((v, i) => (
                              <tr key={v.id || i}>
                                <td>
                                  <select
                                    className="form-select form-select-sm"
                                    value={v.sizeId}
                                    onChange={(e) =>
                                      updateVariant(i, "sizeId", e.target.value)
                                    }
                                  >
                                    <option value="">--</option>
                                    {sizes.map((s) => (
                                      <option
                                        key={s.id}
                                        value={s.id}
                                        disabled={
                                          usedSizeIds.has(s.id) &&
                                          v.sizeId !== s.id
                                        }
                                      >
                                        {localizedName(s.name)} ({s.diameter}cm)
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    value={v.heightMin}
                                    onChange={(e) =>
                                      updateVariant(
                                        i,
                                        "heightMin",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="cm"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    value={v.heightMax}
                                    onChange={(e) =>
                                      updateVariant(
                                        i,
                                        "heightMax",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="cm"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    value={v.price}
                                    onChange={(e) =>
                                      updateVariant(i, "price", e.target.value)
                                    }
                                    placeholder="NT$"
                                  />
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => removeVariant(i)}
                                  >
                                    <i className="bi bi-trash" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
                  onClick={handleDelete}
                >
                  {t("common.delete")}
                </button>
              </>
            ) : (
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
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                >
                  {t("common.confirm")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductModal;
