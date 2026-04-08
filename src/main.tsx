// import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import "./styles_new/toast.css";
import "./i18n";

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
//   <>Currently under maintenance. Will be back up on 04/09/2026. Nicholas's request has already been received is being prepared by Camille.</>
// )