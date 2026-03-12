import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import axios from "axios";
import useMessage from "../hooks/useMessage";
const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

function ProductModal({ getProducts, modalType, templateProduct, closeModal }) {
  const [tempData, setTempData] = useState(templateProduct);
  const { t } = useTranslation();
  const { showSuccess, showError } = useMessage();

  const computedData = useMemo(() => {
    const src = templateProduct || {};
    return {
      id: src.id ?? "",
      title: src.title ?? "",
      category: src.category ?? "",
      origin_price: src.origin_price ?? "",
      price: src.price ?? "",
      unit: src.unit ?? "",
      description: src.description ?? "",
      content: src.content ?? "",
      is_enabled: !!src.is_enabled,
      imageUrl: src.imageUrl ?? "",
      imagesUrl:
        Array.isArray(src.imagesUrl) && src.imagesUrl.length
          ? [...src.imagesUrl]
          : [""],
      shipping: Array.isArray(src.shipping) ? [...src.shipping] : [],
    };
  }, [templateProduct]);

  useEffect(() => {
    setTempData(computedData);
  }, [computedData]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(imageUrl);
    showAlert("success", t("productModal.copySuccess"));
  };

  const handleModalInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setTempData((preData) => ({
      ...preData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleModalImageChange = (index, value) => {
    setTempData((pre) => {
      const newImages = [...pre.imagesUrl];
      newImages[index] = value;
      if (
        value !== "" &&
        index === newImages.length - 1 &&
        newImages.length < 5
      ) {
        newImages.push("");
      }
      if (
        value === "" &&
        newImages.length > 1 &&
        newImages[newImages.length - 1] === ""
      ) {
        newImages.pop();
      }
      return { ...pre, imagesUrl: newImages };
    });
  };

  const handleAddImage = () => {
    setTempData((pre) => ({
      ...pre,
      imagesUrl: [...pre.imagesUrl, ""],
    }));
  };

  const handleRemoveImage = (index) => {
    setTempData((pre) => ({
      ...pre,
      imagesUrl: pre.imagesUrl.filter((_, i) => i !== index),
    }));
  };

  const [alertState, setAlertState] = useState({
    show: false,
    type: "success",
    message: "",
  });

  const showAlert = (type, message) => {
    setAlertState({ show: true, type, message });
    setTimeout(() => {
      setAlertState({ show: false, type: "success", message: "" });
    }, 1500);
  };

  const updateProduct = async (id) => {
    let url = `${API_BASE}/api/${API_PATH}/admin/product`;
    let method = "post";
    if (modalType === "edit") {
      url = `${API_BASE}/api/${API_PATH}/admin/product/${id}`;
      method = "put";
    }

    const productData = {
      data: {
        ...tempData,
        origin_price: Number(tempData.origin_price),
        price: Number(tempData.price),
        is_enabled: tempData.is_enabled ? 1 : 0,
        imagesUrl: [...tempData.imagesUrl.filter((url) => url !== "")],
        shipping: Array.isArray(tempData.shipping)
          ? [...tempData.shipping]
          : [],
      },
    };

    if (!Array.isArray(tempData.shipping) || tempData.shipping.length === 0) {
      showAlert("danger", t("productModal.shippingRequired"));
      return;
    }

    try {
      await axios[method](url, productData);
      showSuccess(
        t(
          modalType === "edit"
            ? "api.updateProductSuccess"
            : "api.createProductSuccess",
        ),
      );
      getProducts();
      closeModal();
    } catch (error) {
      showError(error.response.data.message);
    }
  };

  const deleteProduct = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/${API_PATH}/admin/product/${id}`);
      showSuccess(t("api.deleteProductSuccess"));
      getProducts();
      closeModal();
    } catch (error) {
      showError(error.response.data.message);
    }
  };

  const [imageUrl, setImageUrl] = useState("");

  const uploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("file-to-upload", file);
      const res = await axios.post(
        `${API_BASE}/api/${API_PATH}/admin/upload`,
        formData,
      );
      setImageUrl(res.data.imageUrl);
      showSuccess(t("api.uploadImageSuccess"));
    } catch (error) {
      showError(error.response.data.message);
    }
  };

  const SHIPPING_OPTIONS = [
    { key: "home_delivery", label: t("productModal.shippingHome") },
    { key: "convenience_store", label: t("productModal.shippingStore") },
    { key: "self_pickup", label: t("productModal.shippingSelf") },
  ];

  const handleShippingChange = (e) => {
    const { value, checked } = e.target;
    setTempData((prev) => {
      const prevArr = Array.isArray(prev.shipping) ? [...prev.shipping] : [];
      if (checked) {
        if (!prevArr.includes(value)) prevArr.push(value);
      } else {
        const idx = prevArr.indexOf(value);
        if (idx > -1) prevArr.splice(idx, 1);
      }
      return { ...prev, shipping: prevArr };
    });
  };

  const modalTitleKey =
    modalType === "delete"
      ? "productModal.deleteTitle"
      : modalType === "edit"
        ? "productModal.editTitle"
        : "productModal.createTitle";

  return (
    <>
      {alertState.show && (
        <div
          className={`alert alert-${alertState.type} position-fixed`}
          style={{
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2000,
            minWidth: "300px",
          }}
          role="alert"
        >
          {alertState.message}
        </div>
      )}

      <div
        id="productModal"
        className="modal fade"
        tabIndex="-1"
        aria-labelledby="productModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-xl">
          <div className="modal-content border-0">
            <div
              className={`modal-header bg-${modalType === "delete" ? "danger" : "dark"} text-white`}
            >
              <h5 id="productModalLabel" className="modal-title">
                {t(modalTitleKey)}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              {modalType === "delete" ? (
                <p className="fs-4">
                  {t("productModal.deleteConfirm")}{" "}
                  <span className="text-danger">{tempData.title}</span>{" "}
                  {t("productModal.deleteConfirmSuffix")}
                </p>
              ) : (
                <div className="row">
                  <div className="col-sm-4">
                    <div className="mb-2">
                      <div className="mb-3">
                        <label htmlFor="fileUpload" className="form-label">
                          {t("productModal.uploadImage")}
                        </label>
                        <input
                          className="form-control"
                          type="file"
                          name="fileUpload"
                          id="fileUpload"
                          accept=".jpg, .jpeg, .png"
                          onChange={uploadImage}
                        />
                      </div>
                      <p>
                        {imageUrl}
                        <button
                          type="button"
                          className="btn"
                          onClick={() => handleCopy()}
                        >
                          {imageUrl ? <i className="bi bi-copy"></i> : <></>}
                        </button>
                      </p>
                      <div className="mb-3">
                        <label htmlFor="imageUrl" className="form-label">
                          {t("productModal.imageUrl")}
                        </label>
                        <input
                          type="text"
                          id="imageUrl"
                          name="imageUrl"
                          className="form-control"
                          placeholder={t("productModal.imagePlaceholder")}
                          value={tempData.imageUrl}
                          onChange={(e) => handleModalInputChange(e)}
                        />
                      </div>
                      {tempData.imageUrl && (
                        <img
                          className="img-fluid"
                          src={tempData.imageUrl}
                          alt={tempData.title}
                        />
                      )}
                    </div>
                    <div>
                      {tempData.imagesUrl.map((url, index) => (
                        <div key={index}>
                          <label className="form-label">
                            {t("productModal.imageUrl")}
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder={`${t("productModal.subImagePlaceholder")} ${index + 1}`}
                            value={url}
                            onChange={(e) =>
                              handleModalImageChange(index, e.target.value)
                            }
                          />
                          {url && (
                            <img
                              className="img-fluid"
                              src={url}
                              alt={`副圖${index + 1}`}
                            />
                          )}
                          <div>
                            <button
                              className="btn btn-outline-danger btn-sm d-block w-100"
                              onClick={() => handleRemoveImage(index)}
                            >
                              {t("productModal.deleteImage")}
                            </button>
                          </div>
                        </div>
                      ))}
                      {tempData.imagesUrl.length < 5 &&
                        tempData.imagesUrl[tempData.imagesUrl.length - 1] !==
                          "" && (
                          <button
                            className="btn btn-outline-primary btn-sm d-block w-100"
                            onClick={() => handleAddImage()}
                          >
                            {t("productModal.addImage")}
                          </button>
                        )}
                    </div>
                  </div>
                  <div className="col-sm-8">
                    <div className="mb-3">
                      <label htmlFor="title" className="form-label">
                        {t("productModal.title")}
                      </label>
                      <input
                        name="title"
                        id="title"
                        type="text"
                        className="form-control"
                        placeholder={t("productModal.titlePlaceholder")}
                        value={tempData.title}
                        onChange={(e) => handleModalInputChange(e)}
                      />
                    </div>
                    <div className="row">
                      <div className="mb-3 col-md-6">
                        <label htmlFor="category" className="form-label">
                          {t("productModal.category")}
                        </label>
                        <input
                          name="category"
                          id="category"
                          type="text"
                          className="form-control"
                          placeholder={t("productModal.categoryPlaceholder")}
                          value={tempData.category}
                          onChange={(e) => handleModalInputChange(e)}
                        />
                      </div>
                      <div className="mb-3 col-md-6">
                        <label htmlFor="unit" className="form-label">
                          {t("productModal.unit")}
                        </label>
                        <input
                          name="unit"
                          id="unit"
                          type="text"
                          className="form-control"
                          placeholder={t("productModal.unitPlaceholder")}
                          value={tempData.unit}
                          onChange={(e) => handleModalInputChange(e)}
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="mb-3 col-md-6">
                        <label htmlFor="origin_price" className="form-label">
                          {t("productModal.originPrice")}
                        </label>
                        <input
                          name="origin_price"
                          id="origin_price"
                          type="number"
                          min="0"
                          className="form-control"
                          placeholder={t("productModal.originPricePlaceholder")}
                          value={tempData.origin_price}
                          onChange={(e) => handleModalInputChange(e)}
                        />
                      </div>
                      <div className="mb-3 col-md-6">
                        <label htmlFor="price" className="form-label">
                          {t("productModal.salePrice")}
                        </label>
                        <input
                          name="price"
                          id="price"
                          type="number"
                          min="0"
                          className="form-control"
                          placeholder={t("productModal.salePricePlaceholder")}
                          value={tempData.price}
                          onChange={(e) => handleModalInputChange(e)}
                        />
                      </div>
                    </div>
                    <hr />
                    <div className="mb-3">
                      <label htmlFor="description" className="form-label">
                        {t("productModal.description")}
                      </label>
                      <textarea
                        name="description"
                        id="description"
                        className="form-control"
                        placeholder={t("productModal.descriptionPlaceholder")}
                        value={tempData.description}
                        onChange={(e) => handleModalInputChange(e)}
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="content" className="form-label">
                        {t("productModal.content")}
                      </label>
                      <textarea
                        name="content"
                        id="content"
                        className="form-control"
                        placeholder={t("productModal.contentPlaceholder")}
                        value={tempData.content}
                        onChange={(e) => handleModalInputChange(e)}
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">
                        {t("productModal.shipping")}
                      </label>
                      <div>
                        {SHIPPING_OPTIONS.map((opt) => (
                          <div
                            className="form-check form-check-inline"
                            key={opt.key}
                          >
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`shipping-${opt.key}`}
                              value={opt.key}
                              checked={
                                Array.isArray(tempData.shipping) &&
                                tempData.shipping.includes(opt.key)
                              }
                              onChange={handleShippingChange}
                            />
                            <label
                              className="form-check-label"
                              htmlFor={`shipping-${opt.key}`}
                            >
                              {opt.label}
                            </label>
                          </div>
                        ))}
                        {(!Array.isArray(tempData.shipping) ||
                          tempData.shipping.length === 0) && (
                          <div className="text-danger small">
                            {t("productModal.shippingRequired")}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="form-check">
                        <input
                          name="is_enabled"
                          id="is_enabled"
                          className="form-check-input"
                          type="checkbox"
                          checked={tempData.is_enabled}
                          onChange={(e) => handleModalInputChange(e)}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="is_enabled"
                        >
                          {t("productModal.isEnabled")}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {modalType === "delete" ? (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => deleteProduct(tempData.id)}
                >
                  {t("common.delete")}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    data-bs-dismiss="modal"
                    onClick={() => closeModal()}
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => updateProduct(tempData.id)}
                    disabled={
                      !Array.isArray(tempData.shipping) ||
                      tempData.shipping.length === 0
                    }
                  >
                    {t("common.confirm")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProductModal;
