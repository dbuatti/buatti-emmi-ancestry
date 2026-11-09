import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

// Family build: data is swapped to the family-safe set via the Vite alias
// (@/data/familyData -> src/data/family/familyData.generated.ts). See vite.config.ts.
console.log("Family build: Using family-safe data");

createRoot(document.getElementById("root")!).render(<App />);