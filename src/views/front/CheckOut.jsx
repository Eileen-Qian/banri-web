import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { ThreeDots } from "react-loader-spinner";
import { useTranslation } from "react-i18next";

import {
  api,
  localizedName,
  primaryImageUrl,
  cartHeaders,
  clearCartToken,
  saveDeliveryMethod,
  getSavedDeliveryMethod,
  saveDeliveryAddress,
  getSavedCity,
  getSavedDistrict,
} from "../../utils/api";
import { currency } from "../../utils/currency";
import useMessage from "../../hooks/useMessage";
import {
  emailValidation,
  taiwanPhoneValidation,
  nameValidation,
  cityValidation,
  districtValidation,
  addressValidation,
} from "../../utils/validation";

const NEEDS_ADDRESS = [
  "delivery-private_delivery",
];
const NEEDS_DISTRICT = ["delivery-private_delivery"];

/* ── Order Summary Card ─────────────────────────────────────────────────── */

function OrderSummary({
  t,
  cartItems,
  selectedMethod,
  selectedMethodObj,
  selectedCity,
  selectedDistrict,
  subtotal,
  shipping,
  shippingFee,
  shippingLoading,
  shippingError,
  shippingDetail,
}) {
  const grandTotal = subtotal + shipping;

  // Convenience-store per-item breakdown
  const renderBoxItems = () => {
    if (!shippingDetail?.items || !cartItems) return null;
    return (
      <ul className="list-unstyled mb-0 mt-2 ps-1" style={{ fontSize: "0.85rem" }}>
        {shippingDetail.items.map((est) => {
          const cart = cartItems.find((ci) => ci.variant?.id === est.variantId);
          if (!cart) return null;
          const name = localizedName(cart.variant?.product?.name);
          const size = localizedName(cart.variant?.size?.name);
          return (
            <li key={est.variantId} className="d-flex align-items-start gap-1 mb-1">
              <span className="text-body-secondary">•</span>
              <span>
                {name} {size}{" "}
                <span className="text-body-secondary">
                  {t("cart.itemBoxBreakdown", { qty: est.qty, boxes: est.boxes })}
                </span>
                {est.perBox > 1 && (
                  <span className="text-muted ms-1" style={{ fontSize: "0.8em" }}>
                    ({t("cart.perBoxCapacity", { count: est.perBox })})
                  </span>
                )}
                {est.warning && (
                  <small className="text-warning d-block">
                    <i className="bi bi-exclamation-triangle-fill me-1" />
                    {t(`cart.boxWarning.${est.warning.key}`, est.warning.params)}
                  </small>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    );
  };

  // Method-specific breakdown
  const renderBreakdown = () => {
    if (shippingLoading) {
      return <span className="text-muted fst-italic">{t("common.loading")}</span>;
    }
    if (!shippingDetail || shippingFee === null) return null;

    if (selectedMethod === "delivery-convenience_store") {
      const { totalBoxes, unitFee } = shippingDetail;
      return (
        <>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="badge rounded-pill border border-primary text-primary">
              {localizedName(selectedMethodObj.name)}
            </span>
            <span className="fw-semibold">
              {totalBoxes} {t("cart.boxUnit")}
            </span>
          </div>
          <div className="text-body-secondary mt-1" style={{ fontSize: "0.9rem" }}>
            {t("cart.boxCalc", { count: totalBoxes, fee: currency(Number(unitFee)) })}
          </div>
          {renderBoxItems()}
          {shippingDetail.hasWarnings && (
            <div className="mt-2">
              <small className="text-warning">
                <i className="bi bi-exclamation-triangle-fill me-1" />
                {t("cart.sizeWarning")}
              </small>
            </div>
          )}
        </>
      );
    }

    if (selectedMethod === "delivery-private_delivery") {
      const { trucks, feePerTruck } = shippingDetail;
      return (
        <>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="badge rounded-pill border border-primary text-primary">
              {localizedName(selectedMethodObj.name)}
            </span>
            <span className="fw-semibold">
              {trucks} {t("cart.truckUnit")}
            </span>
          </div>
          <div className="text-body-secondary mt-1" style={{ fontSize: "0.9rem" }}>
            {selectedCity} {selectedDistrict}
            {" — "}
            {t("cart.truckCalc", { count: trucks, fee: currency(Number(feePerTruck)) })}
          </div>
        </>
      );
    }

    if (selectedMethod === "delivery-self_pickup") {
      return (
        <div className="d-flex align-items-center gap-2">
          <span className="badge rounded-pill border border-primary text-primary">
            {localizedName(selectedMethodObj.name)}
          </span>
          <span className="text-success fw-semibold">{t("cart.free")}</span>
        </div>
      );
    }

    return null;
  };

  // Shipping fee value
  const renderShippingValue = () => {
    if (shippingLoading) return <span className="text-muted">…</span>;
    if (shippingFee !== null) {
      return Number(shippingFee) === 0
        ? <span className="text-success fw-semibold">{t("cart.free")}</span>
        : <span>NT$ {currency(shipping)}</span>;
    }
    if (shippingError) return <span className="text-danger">{shippingError}</span>;
    return <span className="text-muted">—</span>;
  };

  return (
    <div className="card border-0 shadow-sm mb-4" style={{ background: "var(--bs-tertiary-bg, #f8f9fa)" }}>
      <div className="card-body px-4 py-3">
        <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
          <i className="bi bi-receipt" />
          {t("cart.orderSummary")}
        </h6>

        {/* Method breakdown with box/truck count */}
        {selectedMethod && selectedMethodObj ? (
          <div className="mb-3 pb-3 border-bottom">
            {renderBreakdown()}
          </div>
        ) : (
          <div className="mb-3 pb-3 border-bottom">
            <small className="text-muted fst-italic">
              {t("cart.selectMethodHint")}
            </small>
          </div>
        )}

        {/* Subtotal */}
        <div className="d-flex justify-content-between mb-2">
          <span className="text-body-secondary">{t("cart.subtotal")}</span>
          <span>NT$ {currency(subtotal)}</span>
        </div>

        {/* Shipping */}
        <div className="d-flex justify-content-between mb-2">
          <span className="text-body-secondary">{t("cart.shippingFee")}</span>
          {renderShippingValue()}
        </div>

        <hr className="my-2" />

        {/* Grand total */}
        <div className="d-flex justify-content-between fw-bold fs-5">
          <span>{t("cart.grandTotal")}</span>
          <span>NT$ {currency(shippingFee !== null ? grandTotal : subtotal)}</span>
        </div>
      </div>
    </div>
  );
}

/* ── CheckOut Page ──────────────────────────────────────────────────────── */

function CheckOut() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState(null);
  const [total, setTotal] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showError } = useMessage();

  // Delivery & shipping state
  const [methods, setMethods] = useState([]);
  const [selectedMethod, setSelectedMethodRaw] = useState(getSavedDeliveryMethod);
  const setSelectedMethod = (id) => {
    setSelectedMethodRaw(id);
    saveDeliveryMethod(id);
  };
  const [regions, setRegions] = useState({ privateDelivery: [] });
  const [districts, setDistricts] = useState([]);
  const [shippingFee, setShippingFee] = useState(null);
  const [shippingDetail, setShippingDetail] = useState(null);
  const [shippingError, setShippingError] = useState("");
  const [shippingLoading, setShippingLoading] = useState(false);
  const [minAmountPrivate, setMinAmountPrivate] = useState("0");
  const [storeChains, setStoreChains] = useState([]);

  // Fetch cart
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await api.get("/api/v1/cart", { headers: cartHeaders() });
        setItems(res.data.items);
        setTotal(res.data.total);
      } catch (error) {
        showError(error.response?.data?.error || error.message);
      }
    };
    fetchCart();
  }, [showError]);

  // Fetch delivery methods
  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const res = await api.get("/api/v1/shipping/methods", {
          headers: cartHeaders(),
        });
        setMethods(res.data.methods);
        setMinAmountPrivate(res.data.minAmountPrivate);
      } catch (error) {
        console.error("Failed to load methods:", error);
      }
    };
    fetchMethods();
  }, []);

  // Auto-switch if selected method is unavailable
  useEffect(() => {
    if (methods.length === 0) return;
    const current = methods.find((m) => m.id === selectedMethod);
    if (current && !current.available) {
      const fallback = methods.find((m) => m.available);
      setSelectedMethod(fallback ? fallback.id : "");
    }
  }, [methods, selectedMethod]);

  // Fetch store chains
  useEffect(() => {
    api.get("/api/v1/shipping/store-chains")
      .then((res) => setStoreChains(res.data.chains))
      .catch(console.error);
  }, []);

  // Fetch regions
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const res = await api.get("/api/v1/shipping/regions");
        setRegions(res.data);
      } catch (error) {
        console.error("Failed to load regions:", error);
      }
    };
    fetchRegions();
  }, []);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      email: "",
      name: "",
      tel: "",
      city: "",
      district: "",
      address: "",
      storeBrand: "",
      storeName: "",
      storeNumber: "",
      message: "",
    },
  });

  const selectedCity = watch("city");
  const selectedDistrict = watch("district");

  const needsAddress = NEEDS_ADDRESS.includes(selectedMethod);
  const needsDistrict = NEEDS_DISTRICT.includes(selectedMethod);
  const isConvenienceStore = selectedMethod === "delivery-convenience_store";

  const selectedMethodObj = methods.find((m) => m.id === selectedMethod);

  // Sync city/district to localStorage when form values change
  useEffect(() => {
    saveDeliveryAddress(selectedCity, selectedDistrict);
  }, [selectedCity, selectedDistrict]);

  // Get city list based on method
  const cityList =
    selectedMethod === "delivery-private_delivery"
      ? regions.privateDelivery
      : [];

  // City display name (bilingual)
  const cityDisplayName = (cityObj) => {
    if (!cityObj) return "";
    if (typeof cityObj === "string") return cityObj;
    return i18n.language?.startsWith("zh") ? cityObj.zh : cityObj.en;
  };

  // Get city value (always use zh for API)
  const cityValue = (cityObj) => {
    if (!cityObj) return "";
    return typeof cityObj === "string" ? cityObj : cityObj.zh;
  };

  // Restore saved city/district after async data loads
  const savedCityRef = useRef(getSavedCity());
  const savedDistrictRef = useRef(getSavedDistrict());
  const prevCityRef = useRef("");
  useEffect(() => {
    const city = savedCityRef.current;
    if (!city || regions.privateDelivery.length === 0) return;
    if (selectedMethod !== "delivery-private_delivery") { savedCityRef.current = null; return; }
    const match = regions.privateDelivery.find((r) => r.city?.zh === city);
    if (match) {
      prevCityRef.current = city; // prevent district reset
      setValue("city", city);
    }
    savedCityRef.current = null;
  }, [regions, selectedMethod, setValue]);

  // Restore saved district after district options load
  useEffect(() => {
    const district = savedDistrictRef.current;
    if (!district || districts.length === 0) return;
    const match = districts.find((d) => (typeof d === "string" ? d : d.zh) === district);
    if (match) setValue("district", district);
    savedDistrictRef.current = null;
  }, [districts, setValue]);

  // Load district options whenever city/method/regions change
  useEffect(() => {
    if (selectedMethod === "delivery-private_delivery") {
      const cityData = regions.privateDelivery.find(
        (r) => r.city?.zh === selectedCity,
      );
      setDistricts(cityData ? cityData.districts : []);
    } else {
      setDistricts([]);
    }
  }, [selectedCity, selectedMethod, regions]);

  // Reset district only when city actually changes (not on regions load)
  useEffect(() => {
    if (prevCityRef.current === selectedCity) return;
    prevCityRef.current = selectedCity;
    setValue("district", "");
    saveDeliveryAddress(selectedCity, "");
    setShippingFee(null);
    setShippingDetail(null);
    setShippingError("");
  }, [selectedCity, setValue]);

  // Reset fields when method changes (skip initial render to preserve saved values)
  const methodInitRef = useRef(true);
  useEffect(() => {
    if (methodInitRef.current) { methodInitRef.current = false; return; }
    setValue("city", "");
    setValue("district", "");
    saveDeliveryAddress("", "");
    setValue("address", "");
    setValue("storeBrand", "");
    setValue("storeName", "");
    setValue("storeNumber", "");
    setShippingFee(null);
    setShippingDetail(null);
    setShippingError("");
  }, [selectedMethod, setValue]);

  // Fetch shipping estimate
  const fetchShipping = useCallback(async () => {
    if (!selectedMethod) return;

    // Self-pickup = free
    if (selectedMethod === "delivery-self_pickup") {
      setShippingFee("0");
      setShippingDetail({});
      return;
    }

    // Convenience store = auto-calc (no address needed)
    if (selectedMethod === "delivery-convenience_store") {
      setShippingLoading(true);
      try {
        const res = await api.post(
          "/api/v1/shipping/estimate",
          { methodId: selectedMethod },
          { headers: cartHeaders() },
        );
        setShippingFee(res.data.shippingFee);
        setShippingDetail(res.data.detail);
        setShippingError("");
      } catch (error) {
        setShippingError(error.response?.data?.error || error.message);
        setShippingFee(null);
        setShippingDetail(null);
      } finally {
        setShippingLoading(false);
      }
      return;
    }

    // Address-based methods
    if (!selectedCity) {
      setShippingFee(null);
      setShippingDetail(null);
      return;
    }
    if (needsDistrict && !selectedDistrict) {
      setShippingFee(null);
      setShippingDetail(null);
      return;
    }

    setShippingLoading(true);
    setShippingError("");
    try {
      const res = await api.post(
        "/api/v1/shipping/estimate",
        {
          methodId: selectedMethod,
          city: selectedCity,
          district: selectedDistrict || undefined,
        },
        { headers: cartHeaders() },
      );
      setShippingFee(res.data.shippingFee);
      setShippingDetail(res.data.detail);
    } catch (error) {
      if (error.response?.status === 404) {
        setShippingError(t("cart.noShippingArea"));
      } else {
        setShippingError(error.response?.data?.error || error.message);
      }
      setShippingFee(null);
      setShippingDetail(null);
    } finally {
      setShippingLoading(false);
    }
  }, [selectedMethod, selectedCity, selectedDistrict, needsDistrict, t]);

  useEffect(() => {
    fetchShipping();
  }, [fetchShipping]);

  // Re-validate on language change
  useEffect(() => {
    const errorFields = Object.keys(errors);
    if (errorFields.length > 0) trigger(errorFields);
  }, [i18n.language, trigger, errors]);

  const onSubmit = async (formData) => {
    if (!selectedMethod) {
      showError(t("cart.selectMethod"));
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.post(
        "/api/v1/orders",
        {
          email: formData.email,
          name: formData.name,
          phone: formData.tel,
          deliveryMethodId: selectedMethod,
          city: formData.city || undefined,
          district: formData.district || undefined,
          address: formData.address || undefined,
          storeBrand: formData.storeBrand || undefined,
          storeName: formData.storeName || undefined,
          storeNumber: formData.storeNumber || undefined,
          message: formData.message || undefined,
        },
        { headers: cartHeaders() },
      );
      clearCartToken();
      navigate(`/order-success/${res.data.orderId}`, {
        state: {
          order: {
            id: res.data.orderId,
            email: formData.email,
            name: formData.name,
            deliveryMethodId: selectedMethod,
            deliveryMethodName: selectedMethodObj?.name ?? null,
            city: formData.city || "",
            district: formData.district || "",
            address: formData.address || "",
            storeBrand: formData.storeBrand || "",
            storeName: formData.storeName || "",
            storeNumber: formData.storeNumber || "",
            shippingFee: res.data.shippingFee,
            total: res.data.total,
            grandTotal: res.data.grandTotal,
            isPaid: false,
            items: items.map((item) => ({
              id: item.id,
              productName: item.variant?.product?.name,
              sizeName: item.variant?.size?.name,
              price: item.variant?.price,
              qty: item.qty,
            })),
          },
        },
      });
    } catch (error) {
      showError(error.response?.data?.error || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items === null)
    return <p className="text-center fs-2 mt-5">{t("common.loading")}</p>;

  if (items.length === 0) {
    return (
      <div className="container mt-5 text-center">
        <p className="fs-4">{t("common.cartEmpty")}</p>
        <NavLink className="btn btn-primary" to="/products">
          {t("common.goShopping")}
        </NavLink>
      </div>
    );
  }

  const subtotal = Number(total);
  const shipping = shippingFee ? Number(shippingFee) : 0;
  const grandTotal = subtotal + shipping;

  return (
    <div className="container mt-5">
      <h2 className="mb-4">{t("checkout.title")}</h2>
      <NavLink className="nav-link text-end" to="/cart">
        <button className="btn btn-primary">{t("checkout.backToCart")}</button>
      </NavLink>

      {/* Cart summary */}
      <div style={{ maxHeight: "250px", overflowY: "auto" }}>
        <table className="table align-middle mb-0">
          <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
            <tr>
              <th style={{ width: "100px" }}>{t("common.image")}</th>
              <th>{t("common.productName")}</th>
              <th style={{ width: "120px" }}>{t("common.unitPrice")}</th>
              <th style={{ width: "100px" }}>{t("common.quantity")}</th>
              <th style={{ width: "120px" }}>{t("common.subtotal")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const v = item.variant;
              const imgUrl = primaryImageUrl(v.product?.images || []);
              return (
                <tr key={item.id}>
                  <td>
                    {imgUrl && (
                      <img
                        src={imgUrl}
                        alt={localizedName(v.product?.name)}
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "cover",
                        }}
                      />
                    )}
                  </td>
                  <td>
                    <div>{localizedName(v.product?.name)}</div>
                    <small className="text-muted">
                      {localizedName(v.size?.name)}
                    </small>
                  </td>
                  <td>NT$ {currency(Number(v.price))}</td>
                  <td className="text-center fs-5 text-primary">{item.qty}</td>
                  <td>NT$ {currency(Number(v.price) * item.qty)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Order form */}
      <div className="my-5 row justify-content-center">
        <form className="col-md-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              {t("checkout.email")}
            </label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder={t("checkout.emailPlaceholder")}
              {...register("email", emailValidation(t))}
            />
            {errors.email && (
              <p className="text-danger">{errors.email.message}</p>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              {t("checkout.name")}
            </label>
            <input
              id="name"
              type="text"
              className="form-control"
              placeholder={t("checkout.namePlaceholder")}
              {...register("name", nameValidation(t))}
            />
            {errors.name && (
              <p className="text-danger">{errors.name.message}</p>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="tel" className="form-label">
              {t("checkout.phone")}
            </label>
            <input
              id="tel"
              type="tel"
              className="form-control"
              placeholder={t("checkout.phonePlaceholder")}
              {...register("tel", taiwanPhoneValidation(t))}
            />
            {errors.tel && <p className="text-danger">{errors.tel.message}</p>}
          </div>

          {/* Delivery method radio */}
          <div className="mb-3">
            <label className="form-label fw-bold">
              {t("cart.deliveryMethod")}
            </label>
            <div className="row g-2">
              {methods.map((m) => {
                const isPrivate = m.id === "delivery-private_delivery";
                const disabled = !m.available;
                return (
                  <div className="col-4" key={m.id}>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="deliveryMethod"
                        id={`method-${m.id}`}
                        value={m.id}
                        disabled={disabled}
                        checked={selectedMethod === m.id}
                        onChange={() => setSelectedMethod(m.id)}
                      />
                      <label
                        className={`form-check-label ${disabled ? "text-muted" : ""}`}
                        htmlFor={`method-${m.id}`}
                      >
                        {localizedName(m.name)}
                        {disabled && (
                          <span className="badge bg-secondary ms-2">
                            {t("cart.methodUnavailable")}
                          </span>
                        )}
                        {isPrivate &&
                          Number(minAmountPrivate) > 0 &&
                          disabled && (
                            <small className="text-muted ms-1">
                              {t("cart.minAmountHint", {
                                amount: currency(Number(minAmountPrivate)),
                              })}
                            </small>
                          )}
                        {m.id === "delivery-self_pickup" && (
                          <small className="text-muted ms-1">
                            — {t("cart.free")}
                          </small>
                        )}
                      </label>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Self-pickup note */}
          {selectedMethod === "delivery-self_pickup" && (
            <div className="alert alert-info">
              {t("cart.selfPickupNote")}
            </div>
          )}

          {/* City / District (for address-based methods) */}
          {needsAddress && (
            <>
              <div className="row mb-3">
                <div className={needsDistrict ? "col-6" : "col-12"}>
                  <label htmlFor="city" className="form-label">
                    {t("checkout.city")}
                  </label>
                  <select
                    id="city"
                    className="form-select"
                    {...register("city", cityValidation(t))}
                  >
                    <option value="">
                      {t("checkout.cityPlaceholder")}
                    </option>
                    {cityList.map((r) => (
                      <option
                        key={cityValue(r.city)}
                        value={cityValue(r.city)}
                      >
                        {cityDisplayName(r.city)}
                      </option>
                    ))}
                  </select>
                  {errors.city && (
                    <p className="text-danger">{errors.city.message}</p>
                  )}
                </div>
                {needsDistrict && (
                  <div className="col-6">
                    <label htmlFor="district" className="form-label">
                      {t("checkout.district")}
                    </label>
                    <select
                      id="district"
                      className="form-select"
                      disabled={!selectedCity}
                      {...register("district", districtValidation(t))}
                    >
                      <option value="">
                        {t("checkout.districtPlaceholder")}
                      </option>
                      {districts.map((d) => {
                        const val = typeof d === "string" ? d : d.zh;
                        return (
                          <option key={val} value={val}>
                            {typeof d === "string" ? d : localizedName(d)}
                          </option>
                        );
                      })}
                    </select>
                    {errors.district && (
                      <p className="text-danger">{errors.district.message}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="address" className="form-label">
                  {t("checkout.address")}
                </label>
                <input
                  id="address"
                  type="text"
                  className="form-control"
                  placeholder={t("checkout.addressPlaceholder")}
                  {...register("address", addressValidation(t))}
                />
                {errors.address && (
                  <p className="text-danger">{errors.address.message}</p>
                )}
              </div>
            </>
          )}

          {/* Convenience store fields */}
          {isConvenienceStore && (
            <>
              <div className="mb-3">
                <label htmlFor="storeBrand" className="form-label">
                  {t("checkout.storeBrand")}
                </label>
                <select
                  id="storeBrand"
                  className="form-select"
                  {...register("storeBrand", {
                    required: isConvenienceStore ? t("validation.storeBrandRequired") : false,
                  })}
                >
                  <option value="">{t("checkout.storeBrandPlaceholder")}</option>
                  {storeChains.map((chain) => (
                    <option key={chain.id} value={chain.id}>
                      {localizedName(chain.name)}
                    </option>
                  ))}
                </select>
                {errors.storeBrand && (
                  <p className="text-danger">{errors.storeBrand.message}</p>
                )}
              </div>

              <div className="row mb-3">
                <div className="col-7">
                  <label htmlFor="storeName" className="form-label">
                    {t("checkout.storeName")}
                  </label>
                  <input
                    id="storeName"
                    type="text"
                    className="form-control"
                    placeholder={t("checkout.storeNamePlaceholder")}
                    {...register("storeName", {
                      required: isConvenienceStore ? t("validation.storeNameRequired") : false,
                    })}
                  />
                  {errors.storeName && (
                    <p className="text-danger">{errors.storeName.message}</p>
                  )}
                </div>
                <div className="col-5">
                  <label htmlFor="storeNumber" className="form-label">
                    {t("checkout.storeNumber")}
                  </label>
                  <input
                    id="storeNumber"
                    type="text"
                    className="form-control"
                    placeholder={t("checkout.storeNumberPlaceholder")}
                    {...register("storeNumber", {
                      required: isConvenienceStore ? t("validation.storeNumberRequired") : false,
                    })}
                  />
                  {errors.storeNumber && (
                    <p className="text-danger">{errors.storeNumber.message}</p>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="mb-3">
            <label htmlFor="message" className="form-label">
              {t("checkout.message")}
            </label>
            <textarea
              id="message"
              className="form-control"
              rows="4"
              {...register("message")}
            />
          </div>

          {shippingError && (
            <div className="alert alert-warning mb-3">{shippingError}</div>
          )}

          {/* Order summary card */}
          <OrderSummary
            t={t}
            cartItems={items}
            selectedMethod={selectedMethod}
            selectedMethodObj={selectedMethodObj}
            selectedCity={selectedCity}
            selectedDistrict={selectedDistrict}
            subtotal={subtotal}
            shipping={shipping}
            shippingFee={shippingFee}
            shippingLoading={shippingLoading}
            shippingError={shippingError}
            shippingDetail={shippingDetail}
          />

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={isSubmitting || !selectedMethod || !!shippingError}
          >
            {isSubmitting ? (
              <ThreeDots
                visible
                height="30"
                width="80"
                color="#fff"
                radius="9"
                wrapperStyle={{ display: "flex", justifyContent: "center" }}
              />
            ) : (
              <>
                {t("checkout.submitOrder")}
                {shippingFee !== null && (
                  <span className="ms-2">
                    (NT$ {currency(grandTotal)})
                  </span>
                )}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CheckOut;
