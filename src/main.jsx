import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Handle LINE Login callback: LINE redirects to base URL with ?code=&state=
// Save code to sessionStorage and redirect to the order success page
const searchParams = new URLSearchParams(window.location.search);
const lineCode = searchParams.get("code");
const lineState = searchParams.get("state"); // contains orderId
if (lineCode && lineState) {
  sessionStorage.setItem("lineCallbackCode", lineCode);
  sessionStorage.setItem("lineCallbackOrderId", lineState);
  // Redirect to order success page (clean URL)
  window.location.replace(`${window.location.pathname}#/order-success/${lineState}`);
}

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./i18n/index.js";
import App from "./App.jsx";
import { Provider } from "react-redux";
import store from "./store/store.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
