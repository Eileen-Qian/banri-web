import { useEffect, useRef, useState } from "react";
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

function OrderSummary({ t, subtotal, selectedMethod }) {
  const isSelfPickup = selectedMethod === "delivery-self_pickup";
  const showShippingNote = selectedMethod && !isSelfPickup;
  return (
    <div className="card border-0 shadow-sm mb-4" style={{ background: "var(--bs-tertiary-bg, #f8f9fa)" }}>
      <div className="card-body px-4 py-3">
        <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
          <i className="bi bi-receipt" />
          {t("cart.orderSummary")}
        </h6>

        {/* Subtotal */}
        <div className="d-flex justify-content-between mb-2">
          <span className="text-body-secondary">{t("cart.subtotal")}</span>
          <span>NT$ {currency(subtotal)}</span>
        </div>

        {showShippingNote && (
          <>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-body-secondary">{t("cart.shippingFee")}</span>
              <span className="text-muted">{t("shipping.afterConfirm")}</span>
            </div>
          </>
        )}

        <hr className="my-2" />

        {/* Total */}
        <div className="d-flex justify-content-between fw-bold fs-5">
          <span>{t("cart.grandTotal")}</span>
          <span>NT$ {currency(subtotal)}</span>
        </div>

        {showShippingNote && (
          <small className="text-muted d-block mt-3 lh-base">
            <i className="bi bi-info-circle me-1" />
            {t("shipping.checkoutNote")}
            {<br />}
            <a href="#/shipping" target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none">
              {t("shipping.shippingLink")} <i className="bi bi-box-arrow-up-right small" />
            </a>
          </small>
        )}
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
  const selectedStoreBrand = watch("storeBrand");

  const needsAddress = NEEDS_ADDRESS.includes(selectedMethod);
  const needsDistrict = NEEDS_DISTRICT.includes(selectedMethod);
  const isConvenienceStore = selectedMethod === "delivery-convenience_store";

  // Find the selected chain's store-finder URL (if any)
  const selectedChain = storeChains.find((c) => c.id === selectedStoreBrand);
  const finderUrl = selectedChain?.finderUrl;

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
  }, [selectedMethod, setValue]);

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
            orderNumber: res.data.orderNumber,
            email: formData.email,
            name: formData.name,
            deliveryMethodId: selectedMethod,
            deliveryMethodName: selectedMethodObj?.name ?? null,
            city: formData.city || "",
            district: formData.district || "",
            address: formData.address || "",
            storeBrand: formData.storeBrand || "",
            storeBrandName: selectedChain?.name ?? null,
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
                            <>
                              <br />
                              <small className="text-muted">
                                {t("cart.minAmountHint", {
                                  amount: currency(Number(minAmountPrivate)),
                                })}
                              </small>
                            </>
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
            <div className="alert alert-primary text-primary">
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
                <div className="d-flex gap-2">
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
                  {finderUrl && (
                    <a
                      href={finderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-primary text-nowrap"
                    >
                      <i className="bi bi-geo-alt me-1" />
                      {t("checkout.lookupStore")}
                      <i className="bi bi-box-arrow-up-right ms-1 small" />
                    </a>
                  )}
                </div>
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

          {/* Order summary card */}
          <OrderSummary t={t} subtotal={subtotal} selectedMethod={selectedMethod} />

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={isSubmitting || !selectedMethod}
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
              t("checkout.submitOrder")
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CheckOut;
