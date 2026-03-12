import { useState } from "react";
import { Outlet, NavLink } from "react-router";
import { useTranslation } from "react-i18next";

import logo from "../assets/images/BanriLogo 1.svg";
import LanguageSwitcher from "../components/LanguageSwitcher";

function FrontendLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-body-tertiary fixed-top">
        <div className="container-fluid">
          <NavLink className="navbar-brand" to="/" onClick={closeMenu}>
            <img src={logo} alt="Banri" />
          </NavLink>

          {/* 手機版：永遠顯示在漢堡按鈕左側，桌面隱藏 */}
          <div className="d-lg-none ms-auto me-2">
            <LanguageSwitcher />
          </div>

          <button
            className="navbar-toggler"
            type="button"
            aria-controls="navbarSupportedContent"
            aria-expanded={isOpen}
            aria-label="Toggle navigation"
            onClick={toggleMenu}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div
            className={`collapse navbar-collapse ${isOpen ? "show" : ""}`}
            id="navbarSupportedContent"
          >
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to="/products"
                  onClick={closeMenu}
                >
                  {t("nav.products")}
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/cart" onClick={closeMenu}>
                  {t("nav.cart")}
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to="/checkout"
                  onClick={closeMenu}
                >
                  {t("nav.checkout")}
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/login" onClick={closeMenu}>
                  {t("nav.admin")}
                </NavLink>
              </li>
            </ul>

            {/* 桌面版：在 collapse 內右側，手機隱藏 */}
            <div className="d-none d-lg-flex align-items-center">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </nav>
      <main style={{ paddingTop: "150px" }}>
        <Outlet />
      </main>
    </>
  );
}

export default FrontendLayout;
