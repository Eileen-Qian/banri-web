import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { api, localizedName } from "../../utils/api";
import { currency } from "../../utils/currency";
import useMessage from "../../hooks/useMessage";

// Known settings displayed in the settings section
const SETTING_DEFS = [
  {
    key: "convenience_store_fee",
    i18n: "adminShipping.convenienceStoreFee",
  },
  {
    key: "private_delivery_min_amount",
    i18n: "adminShipping.privateDeliveryMinAmount",
  },
];

const PRIVATE_DELIVERY_ID = "delivery-private_delivery";

function AdminShipping() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useMessage();

  // ── Settings ────────────────────────────────────────────────────────────────

  const [settingValues, setSettingValues] = useState({});
  const [savedValues, setSavedValues] = useState({});
  const [savingKey, setSavingKey] = useState(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get("/api/v1/admin/settings");
      const vals = {};
      res.data.settings.forEach((s) => (vals[s.key] = s.value));
      setSettingValues(vals);
      setSavedValues(vals);
    } catch (error) {
      showError(error.response?.data?.error || error.message);
    }
  }, [showError]);

  const saveSetting = async (key) => {
    setSavingKey(key);
    try {
      await api.put(`/api/v1/admin/settings/${key}`, {
        value: settingValues[key] ?? "",
      });
      setSavedValues((prev) => ({ ...prev, [key]: settingValues[key] }));
      showSuccess(t("adminShipping.saved"));
    } catch (error) {
      showError(error.response?.data?.error || error.message);
    } finally {
      setSavingKey(null);
    }
  };

  const resetSetting = (key) => {
    setSettingValues((prev) => ({ ...prev, [key]: savedValues[key] ?? "" }));
  };

  const isModified = (key) =>
    (settingValues[key] ?? "") !== (savedValues[key] ?? "");

  // ── Rates ───────────────────────────────────────────────────────────────────

  const [rates, setRates] = useState([]);
  const [filterCity, setFilterCity] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [editingRate, setEditingRate] = useState(null);
  const [editData, setEditData] = useState({
    city: "",
    district: "",
    zone: "",
    fee: "",
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newData, setNewData] = useState({
    city: "",
    district: "",
    zone: "",
    fee: "",
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const newCityRef = useRef(null);
  const editCityRef = useRef(null);

  const fetchRates = useCallback(async () => {
    try {
      const res = await api.get(
        `/api/v1/admin/shipping-rates?methodId=${PRIVATE_DELIVERY_ID}`,
      );
      setRates(res.data.rates);
    } catch (error) {
      showError(error.response?.data?.error || error.message);
    }
  }, [showError]);

  const saveRate = async (id) => {
    try {
      await api.put(`/api/v1/admin/shipping-rates/${id}`, editData);
      setEditingRate(null);
      await fetchRates();
      showSuccess(t("adminShipping.saved"));
    } catch (error) {
      showError(error.response?.data?.error || error.message);
    }
  };

  const createRate = async () => {
    if (!newData.fee) return;
    try {
      await api.post("/api/v1/admin/shipping-rates", {
        deliveryMethodId: PRIVATE_DELIVERY_ID,
        ...newData,
      });
      setIsAdding(false);
      setNewData({ city: "", district: "", zone: "", fee: "" });
      await fetchRates();
      showSuccess(t("adminShipping.saved"));
    } catch (error) {
      showError(error.response?.data?.error || error.message);
    }
  };

  const deleteRate = async () => {
    if (!deleteTarget) return;
    // Check if this is the last item in the filtered city
    const targetRate = rates.find((r) => r.id === deleteTarget);
    const cityZh = targetRate?.city?.zh;
    const cityCount = cityZh
      ? rates.filter((r) => r.city?.zh === cityZh).length
      : 0;

    try {
      await api.delete(`/api/v1/admin/shipping-rates/${deleteTarget}`);
      setDeleteTarget(null);

      // If last item in this city, reset filter to show all
      if (cityZh === filterCity && cityCount <= 1) {
        setFilterCity("");
        setFilterDistrict("");
      }

      await fetchRates();
      showSuccess(t("adminShipping.deleted"));
    } catch (error) {
      showError(error.response?.data?.error || error.message);
    }
  };

  // All existing city values (zh) for datalist suggestions
  const allCities = useMemo(
    () => [...new Set(rates.map((r) => r.city?.zh).filter(Boolean))].sort(),
    [rates],
  );

  // Derived filter options
  const cities = useMemo(() => {
    const seen = new Map();
    for (const r of rates) {
      if (r.city) seen.set(r.city.zh, r.city);
    }
    return [...seen.values()].sort((a, b) => a.zh.localeCompare(b.zh, "zh-TW"));
  }, [rates]);

  const districts = useMemo(() => {
    const filtered = filterCity
      ? rates.filter((r) => r.city?.zh === filterCity)
      : rates;
    const seen = new Map();
    for (const r of filtered) {
      if (r.district) seen.set(r.district.zh, r.district);
    }
    return [...seen.values()].sort((a, b) => a.zh.localeCompare(b.zh, "zh-TW"));
  }, [rates, filterCity]);

  // Reset district when city changes
  useEffect(() => {
    setFilterDistrict("");
  }, [filterCity]);

  // Focus and scroll to new row when adding
  useEffect(() => {
    if (isAdding && newCityRef.current) {
      newCityRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      newCityRef.current.focus();
    }
  }, [isAdding]);

  // Focus first input when editing
  useEffect(() => {
    if (editingRate && editCityRef.current) {
      editCityRef.current.focus();
    }
  }, [editingRate]);

  // Client-side filtered rates
  const filteredRates = useMemo(() => {
    let result = rates;
    if (filterCity) result = result.filter((r) => r.city?.zh === filterCity);
    if (filterDistrict)
      result = result.filter((r) => r.district?.zh === filterDistrict);
    return result;
  }, [rates, filterCity, filterDistrict]);

  // ── Init ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchSettings();
    fetchRates();
  }, [fetchSettings, fetchRates]);

  return (
    <div className="container mt-4">
      <h2 className="mb-4">{t("adminShipping.title")}</h2>

      {/* ── System settings ─────────────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">{t("adminShipping.settingsSection")}</h5>
        </div>
        <div className="card-body">
          {SETTING_DEFS.map((def) => (
            <div key={def.key} className="row align-items-center mb-3">
              <div className="col-md-4">
                <label className="form-label mb-0 fw-bold">{t(def.i18n)}</label>
              </div>
              <div className="col-md-4">
                <div className="input-group">
                  <span className="input-group-text">NT$</span>
                  <input
                    type="number"
                    className="form-control"
                    value={settingValues[def.key] ?? ""}
                    onChange={(e) =>
                      setSettingValues((prev) => ({
                        ...prev,
                        [def.key]: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="col-md-3 d-flex gap-2">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => saveSetting(def.key)}
                  disabled={savingKey === def.key || !isModified(def.key)}
                >
                  {savingKey === def.key ? "..." : t("adminShipping.save")}
                </button>
                {isModified(def.key) && (
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => resetSetting(def.key)}
                  >
                    {t("common.cancel")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Shipping rates ──────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 className="mb-0">{t("adminShipping.ratesSection")}</h5>
          <div className="d-flex gap-2 align-items-center">
            {!isAdding && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setIsAdding(true);
                  setEditingRate(null);
                }}
              >
                <i className="bi bi-plus-lg me-1" />
                {t("adminShipping.addRate")}
              </button>
            )}
            <select
              className="form-select form-select-sm"
              style={{ width: "auto" }}
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
            >
              <option value="">{t("adminShipping.allCities")}</option>
              {cities.map((c) => (
                <option key={c.zh} value={c.zh}>
                  {localizedName(c)}
                </option>
              ))}
            </select>
            <select
              className="form-select form-select-sm"
              style={{ width: "auto" }}
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
            >
              <option value="">{t("adminShipping.allDistricts")}</option>
              {districts.map((d) => (
                <option key={d.zh} value={d.zh}>
                  {localizedName(d)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive" style={{ maxHeight: "500px" }}>
            <table className="table table-hover align-middle mb-0">
              <thead
                className="table-light"
                style={{ position: "sticky", top: 0 }}
              >
                <tr>
                  <th>{t("adminShipping.city")}</th>
                  <th>{t("adminShipping.district")}</th>
                  <th>{t("adminShipping.zone")}</th>
                  <th style={{ width: "180px" }}>{t("adminShipping.fee")}</th>
                  <th style={{ width: "100px" }}></th>
                </tr>
              </thead>
              <tbody>
                {/* Add new row */}
                {isAdding && (
                  <tr>
                    <td>
                      <input
                        ref={newCityRef}
                        type="text"
                        className="form-control form-control-sm"
                        value={newData.city}
                        placeholder={t("adminShipping.city")}
                        list="city-options"
                        onKeyDown={(e) =>
                          e.key === "Escape" && setIsAdding(false)
                        }
                        onChange={(e) =>
                          setNewData((p) => ({ ...p, city: e.target.value }))
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={newData.district}
                        placeholder={t("adminShipping.district")}
                        onKeyDown={(e) =>
                          e.key === "Escape" && setIsAdding(false)
                        }
                        onChange={(e) =>
                          setNewData((p) => ({
                            ...p,
                            district: e.target.value,
                          }))
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={newData.zone}
                        placeholder={t("adminShipping.zone")}
                        onKeyDown={(e) =>
                          e.key === "Escape" && setIsAdding(false)
                        }
                        onChange={(e) =>
                          setNewData((p) => ({ ...p, zone: e.target.value }))
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={newData.fee}
                        placeholder={t("adminShipping.fee")}
                        onChange={(e) =>
                          setNewData((p) => ({ ...p, fee: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") createRate();
                          if (e.key === "Escape") setIsAdding(false);
                        }}
                      />
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={createRate}
                        >
                          ✓
                        </button>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => {
                            setIsAdding(false);
                            setNewData({
                              city: "",
                              district: "",
                              zone: "",
                              fee: "",
                            });
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                {filteredRates.map((r) => (
                  <tr key={r.id}>
                    {editingRate === r.id ? (
                      <>
                        <td>
                          <input
                            ref={editCityRef}
                            type="text"
                            className="form-control form-control-sm"
                            value={editData.city}
                            list="city-options"
                            onKeyDown={(e) =>
                              e.key === "Escape" && setEditingRate(null)
                            }
                            onChange={(e) =>
                              setEditData((p) => ({
                                ...p,
                                city: e.target.value,
                              }))
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={editData.district}
                            onKeyDown={(e) =>
                              e.key === "Escape" && setEditingRate(null)
                            }
                            onChange={(e) =>
                              setEditData((p) => ({
                                ...p,
                                district: e.target.value,
                              }))
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={editData.zone}
                            onKeyDown={(e) =>
                              e.key === "Escape" && setEditingRate(null)
                            }
                            onChange={(e) =>
                              setEditData((p) => ({
                                ...p,
                                zone: e.target.value,
                              }))
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={editData.fee}
                            onChange={(e) =>
                              setEditData((p) => ({
                                ...p,
                                fee: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveRate(r.id);
                              if (e.key === "Escape") setEditingRate(null);
                            }}
                          />
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => saveRate(r.id)}
                            >
                              ✓
                            </button>
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => setEditingRate(null)}
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{r.city ? localizedName(r.city) : "—"}</td>
                        <td>{r.district ? localizedName(r.district) : "—"}</td>
                        <td>{r.zone ? localizedName(r.zone) : "—"}</td>
                        <td>NT$ {currency(Number(r.fee))}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <button
                              className="btn btn-outline-primary btn-sm"
                              title={t("adminShipping.editFee")}
                              onClick={() => {
                                setIsAdding(false);
                                setEditingRate(r.id);
                                setEditData({
                                  city: r.city?.zh || "",
                                  district: r.district?.zh || "",
                                  zone: r.zone?.zh || "",
                                  fee: r.fee.toString(),
                                });
                              }}
                            >
                              <i className="bi bi-pencil" />
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              title={t("common.delete")}
                              onClick={() => setDeleteTarget(r.id)}
                            >
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {filteredRates.length === 0 && !isAdding && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">
                      —
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <datalist id="city-options">
        {allCities.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="modal-dialog modal-sm modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-body text-center py-4">
                <i
                  className="bi bi-exclamation-triangle text-warning"
                  style={{ fontSize: "2rem" }}
                />
                <p className="mt-3 mb-0">{t("adminShipping.deleteConfirm")}</p>
              </div>
              <div className="modal-footer justify-content-center border-0 pt-0">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setDeleteTarget(null)}
                >
                  {t("common.cancel")}
                </button>
                <button className="btn btn-danger btn-sm" onClick={deleteRate}>
                  {t("common.delete")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminShipping;
