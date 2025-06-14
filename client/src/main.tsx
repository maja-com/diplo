import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "boxicons/css/boxicons.min.css";

createRoot(document.getElementById("root")!).render(<App />);
