import canvaPlugin from "@canva/app-eslint-plugin";

export default [
  {
    ignores: [
      "**/node_modules/",
      "**/dist",
      "**/*.d.ts",
      "**/*.d.tsx",
      "**/*.config.*",
    ],
  },
  ...canvaPlugin.configs.apps_no_i18n,
  {
    files: [
      "src/**/*",
      // Currently only the localization examples are localized and following the
      // formatjs guidelines. If more examples are localized, this list should be
      // updated:
      "examples/localization/**/*",
    ],
    ...canvaPlugin.configs.apps_i18n,
  },
  {
    files: ["src/components/IconItem.tsx", "src/intents/design_editor/app.tsx"],
    rules: {
      // Allow <img> for icon thumbnails and <button> for tiny favorite toggles
      // ImageCard and Button components are not suitable for these specific inline use cases
      "react/forbid-elements": "off",
      // Allow console for error logging
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  {
    files: ["src/hooks/useFavorites.ts"],
    rules: {
      // Allow console for debugging in hooks
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
];
