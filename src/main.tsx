// import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import "./styles_new/toast.css";
import "./i18n";
import "./styles/animations.scss";
import "./styles/theme.css";
import "./styles/base.css";
import "./styles/text.scss";
import "./styles/layout.scss";
import "./styles/controls.css";
import "./styles/utilities.scss";

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <BrowserRouter>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>,
  // {/* </React.StrictMode> */}
);

// ReactDOM.createRoot(document.getElementById("root")!).render(
//   <>Currently under maintenance. Ask Michael or Camille if you need something.</>
// )
