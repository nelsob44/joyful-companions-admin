import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import AdminContextProvider from "./context/AdminContext.tsx";
import CompanionContextProvider from "./context/CompanionContext.tsx";
import AppContextProvider from "./context/AppContext.tsx";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AdminContextProvider>
      <CompanionContextProvider>
        <AppContextProvider>
          <App />
        </AppContextProvider>
      </CompanionContextProvider>
    </AdminContextProvider>
  </BrowserRouter>,
);
