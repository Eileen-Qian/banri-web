import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { setAuthToken } from "../utils/api";
import logo from "../assets/images/BanriLogo 1.svg";
import useMessage from "../hooks/useMessage";
import LanguageSwitcher from "../components/LanguageSwitcher";
import DarkModeToggle from "../components/DarkModeToggle";

function AdminLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showSuccess } = useMessage();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  const logout = () => {
    setAuthToken(null);
    navigate("/login");
    showSuccess(t("api.logoutSuccess"));
  };

  return (
    <>
      <nav
        className={`navbar navbar-expand-lg bg-body-tertiary fixed-top${scrolled ? " navbar-scrolled" : ""}`}
      >
        <div className="container-fluid">
          <NavLink className="navbar-brand" to="/" onClick={closeMenu}>
            <img src={logo} alt="Banri" />
          </NavLink>

          {/* 手機版：永遠顯示在漢堡按鈕左側，桌面隱藏 */}
          <div className="d-lg-none ms-auto me-2 d-flex align-items-center gap-1">
            <DarkModeToggle />
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
                  to="/admin/products"
                  onClick={closeMenu}
                >
                  {t("admin.nav.products")}
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to="/admin/orders"
                  onClick={closeMenu}
                >
                  {t("admin.nav.orders")}
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to="/admin/shipping"
                  onClick={closeMenu}
                >
                  {t("admin.nav.shipping")}
                </NavLink>
              </li>
            </ul>

            {/* 桌面版：在 collapse 內右側，手機隱藏 */}
            <div className="d-none d-lg-flex align-items-center gap-1">
              <DarkModeToggle />
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </nav>
      <main style={{ paddingTop: "150px" }}>
        <div className="mt-4 d-flex justify-content-between">
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate("/")}
          >
            {t("admin.nav.backToFront")}
          </button>
          <button className="btn btn-outline-primary" onClick={logout}>
            {t("admin.nav.logout")}
          </button>
        </div>
        <Outlet />
      </main>
    </>
  );
}

export default AdminLayout;
