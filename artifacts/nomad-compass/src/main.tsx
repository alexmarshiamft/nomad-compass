import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";

const isProd = import.meta.env.PROD;
const apiUrl = import.meta.env.VITE_API_URL || (isProd ? "" : "http://127.0.0.1:3000");
setBaseUrl(apiUrl);
createRoot(document.getElementById("root")!).render(<App />);
