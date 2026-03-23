import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/noto-serif-sc/400.css";
import "@fontsource/noto-sans-sc/400.css";
import "@fontsource/lxgw-wenkai/index.css";
import "@fontsource/lxgw-wenkai-mono-tc/index.css";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
