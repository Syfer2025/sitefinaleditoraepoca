import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { getLogos } from "./app/data/api.ts";

// Dispara a busca da logo antes do React renderizar,
// para que o cache dedupeRequest já esteja populado quando o Navbar montar.
getLogos();

createRoot(document.getElementById("root")!).render(<App />);
  