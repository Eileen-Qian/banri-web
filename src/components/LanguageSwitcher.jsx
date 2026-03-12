import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "zh-TW", label: "繁中" },
  { code: "en", label: "EN" },
];

function LanguageSwitcher({ dropdownAlign = "end" }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const current =
    LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleChange = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div className="position-relative" ref={containerRef}>
      <button
        className="btn btn-link nav-link dropdown-toggle px-2 py-1"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        type="button"
        style={{
          textDecoration: "none",
          fontWeight: 600,
          letterSpacing: "0.03em",
        }}
      >
        🌐 {current.label}
      </button>
      <ul
        className={`dropdown-menu dropdown-menu-${dropdownAlign} ${open ? "show" : ""}`}
        style={{ minWidth: "140px", right: 0, left: "auto" }}
      >
        {LANGUAGES.map((lang) => (
          <li key={lang.code}>
            <button
              className={`dropdown-item d-flex align-items-center gap-2 ${i18n.language === lang.code ? "active" : ""}`}
              onClick={() => handleChange(lang.code)}
              type="button"
            >
              <i
                className="bi bi-check2"
                style={{
                  fontSize: "0.9rem",
                  visibility:
                    i18n.language === lang.code ? "visible" : "hidden",
                }}
              />
              {lang.code === "zh-TW" ? "繁體中文" : "English"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default LanguageSwitcher;
