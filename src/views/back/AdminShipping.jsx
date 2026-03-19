import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../../utils/api";
import { currency } from "../../utils/currency";
import useMessage from "../../hooks/useMessage";

// Known settings displayed in the settings section
const SETTING_DEFS = [
  {
    key: "convenience_store_fee",
    i18n: "adminShipping.convenienceStoreFee"
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

  const isModified = (key) => (settingValues[key] ?? "") !== (savedValues[key] ?? "");

  // ── Rates ───────────────────────────────────────────────────────────────────

  const [rates, setRates] = useState([]);
  const [filterCity, setFilterCity] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [editingRate, setEditingRate] = useState(null);
  const [editFee, setEditFee] = useState("");

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
      await api.put(`/api/v1/admin/shipping-rates/${id}`, { fee: editFee });
      setEditingRate(null);
      setEditFee("");
      await fetchRates();
      showSuccess(t("adminShipping.saved"));
    } catch (error) {
      showError(error.response?.data?.error || error.message);
    }
  };

  // Derived filter options
  const cities = useMemo(
    () => [...new Set(rates.map((r) => r.city).filter(Boolean))].sort(),
    [rates],
  );

  const districts = useMemo(() => {
    const filtered = filterCity
      ? rates.filter((r) => r.city === filterCity)
      : rates;
    return [...new Set(filtered.map((r) => r.district).filter(Boolean))].sort();
  }, [rates, filterCity]);

  // Reset district when city changes
  useEffect(() => {
    setFilterDistrict("");
  }, [filterCity]);

  // Client-side filtered rates
  const filteredRates = useMemo(() => {
    let result = rates;
    if (filterCity) result = result.filter((r) => r.city === filterCity);
    if (filterDistrict)
      result = result.filter((r) => r.district === filterDistrict);
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
            <select
              className="form-select form-select-sm"
              style={{ width: "auto" }}
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
            >
              <option value="">{t("adminShipping.allCities")}</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
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
                <option key={d} value={d}>
                  {d}
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
                {filteredRates.map((r) => (
                  <tr key={r.id}>
                    <td>{r.city || "—"}</td>
                    <td>{r.district || "—"}</td>
                    <td>{r.zone || "—"}</td>
                    <td>
                      {editingRate === r.id ? (
                        <div className="input-group input-group-sm">
                          <input
                            type="number"
                            className="form-control"
                            value={editFee}
                            onChange={(e) => setEditFee(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && saveRate(r.id)
                            }
                            autoFocus
                          />
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
                      ) : (
                        <span>NT$ {currency(Number(r.fee))}</span>
                      )}
                    </td>
                    <td>
                      {editingRate !== r.id && (
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => {
                            setEditingRate(r.id);
                            setEditFee(r.fee.toString());
                          }}
                        >
                          {t("adminShipping.editFee")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredRates.length === 0 && (
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
    </div>
  );
}

export default AdminShipping;
