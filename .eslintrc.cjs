const baseRestrictedPatterns = [
  "apps/studio/**",
  "apps/studio/app/payload-types",
  "@/app/**",
  "@/app/payload-types",
  "@/host/**",
  "payload-types",
  "**/payload-types",
  "**/payload-types/**",
];

const forgeRestrictedPatterns = [
  ...baseRestrictedPatterns,
  "**/writer/**",
  "@/writer/**",
  "@magicborn/dialogue-forge/src/writer/**",
  "packages/dialogue-forge/src/writer/**",
];

const writerRestrictedPatterns = [
  ...baseRestrictedPatterns,
  "**/forge/**",
  "@/forge/**",
  "@magicborn/dialogue-forge/src/forge/**",
  "packages/dialogue-forge/src/forge/**",
];

const sharedRestrictedPatterns = [
  ...baseRestrictedPatterns,
  "**/ai/**",
  "**/forge/**",
  "**/writer/**",
  "@/ai/**",
  "@/forge/**",
  "@/writer/**",
  "@magicborn/dialogue-forge/src/ai/**",
  "@magicborn/dialogue-forge/src/forge/**",
  "@magicborn/dialogue-forge/src/writer/**",
  "packages/dialogue-forge/src/ai/**",
  "packages/dialogue-forge/src/forge/**",
  "packages/dialogue-forge/src/writer/**",
];

const aiRestrictedPatterns = [
  ...baseRestrictedPatterns,
  "**/forge/**",
  "**/writer/**",
  "@/forge/**",
  "@/writer/**",
  "@magicborn/dialogue-forge/src/forge/**",
  "@magicborn/dialogue-forge/src/writer/**",
  "packages/dialogue-forge/src/forge/**",
  "packages/dialogue-forge/src/writer/**",
];

module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2023,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["@typescript-eslint"],
  overrides: [
    {
      files: ["apps/studio/app/**/*.{js,jsx,ts,tsx}"],
      extends: ["next/core-web-vitals"],
      rules: {
        // Next.js recommended rules are included via extends
        "@next/next/no-html-link-for-pages": "error",
        "@next/next/no-img-element": "warn",
      },
    },
    {
      files: ["packages/dialogue-forge/src/**/*.{js,jsx,ts,tsx}", "packages/dialogue-forge/src/**/*.d.ts"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: baseRestrictedPatterns,
          },
        ],
      },
    },
    {
      files: ["packages/dialogue-forge/src/forge/**/*.{js,jsx,ts,tsx}", "packages/dialogue-forge/src/forge/**/*.d.ts"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: forgeRestrictedPatterns,
          },
        ],
      },
    },
    {
      files: ["packages/dialogue-forge/src/writer/**/*.{js,jsx,ts,tsx}", "packages/dialogue-forge/src/writer/**/*.d.ts"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: writerRestrictedPatterns,
          },
        ],
      },
    },
    {
      files: ["packages/dialogue-forge/src/shared/**/*.{js,jsx,ts,tsx}", "packages/dialogue-forge/src/shared/**/*.d.ts"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: sharedRestrictedPatterns,
          },
        ],
      },
    },
    {
      files: ["packages/dialogue-forge/src/ai/**/*.{js,jsx,ts,tsx}", "packages/dialogue-forge/src/ai/**/*.d.ts"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: aiRestrictedPatterns,
          },
        ],
      },
    },
  ],
};
