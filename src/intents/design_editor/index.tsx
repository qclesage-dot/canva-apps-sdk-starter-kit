import "@canva/app-ui-kit/styles.css";
import { AppUiProvider } from "@canva/app-ui-kit";
import type { DesignEditorIntent } from "@canva/intents/design";
import { createRoot } from "react-dom/client";
import { App } from "./app";  // Adjust path if needed (e.g., "./app" or "../app")

async function render() {
  const root = createRoot(document.getElementById("root") as HTMLElement);
  root.render(
    <AppUiProvider>
      <App />
    </AppUiProvider>
  );
}

const designEditor: DesignEditorIntent = {
  render,
};

export default designEditor;

// Hot reload support
if (module.hot) {
  module.hot.accept("./app", render);  // Adjust path to match your App import
}