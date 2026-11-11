import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerAndroidBackButton } from "./lib/native/backButton";

registerAndroidBackButton();

createRoot(document.getElementById("root")!).render(<App />);
