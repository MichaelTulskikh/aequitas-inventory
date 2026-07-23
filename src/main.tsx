// import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
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
import queryClient from "./utils/queryClient";

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>,
  // {/* </React.StrictMode> */}
);

// ReactDOM.createRoot(document.getElementById("root")!).render(
//   <>Currently under maintenance. Ask Michael or Camille if you need something.</>
// )
