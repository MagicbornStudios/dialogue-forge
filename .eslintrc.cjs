const baseRestrictedPatterns = [
  "app/**",
  "@/app/**",
  "@magicborn/dialogue-forge/app/**",
  "payload-types",
  "**/payload-types",
  "**/payload-types/**",
];

const forgeRestrictedPatterns = [
  ...baseRestrictedPatterns,
  "**/writer/**",
  "@/src/writer/**",
  "@magicborn/dialogue-forge/src/writer/**",
  "src/writer/**",
];

const writerRestrictedPatterns = [
  ...baseRestrictedPatterns,
  "**/forge/**",
  "@/src/forge/**",
  "@magicborn/dialogue-forge/src/forge/**",
  "src/forge/**",
];

const sharedRestrictedPatterns = [
  ...baseRestrictedPatterns,
  "**/forge/**",
  "**/writer/**",
  "@/src/forge/**",
  "@/src/writer/**",
  "@magicborn/dialogue-forge/src/forge/**",
  "@magicborn/dialogue-forge/src/writer/**",
  "src/forge/**",
  "src/writer/**",
];

module.exports = {
  root: true,
  overrides: [
    {
      files: ["src/**/*.{js,jsx,ts,tsx}", "src/**/*.d.ts"],
      rules: {
        "no-restricted-imports": [
          "warn",
          {
            patterns: baseRestrictedPatterns,
          },
        ],
      },
    },
    {
      files: ["src/forge/**/*.{js,jsx,ts,tsx}", "src/forge/**/*.d.ts"],
      rules: {
        "no-restricted-imports": [
          "warn",
          {
            patterns: forgeRestrictedPatterns,
          },
        ],
      },
    },
    {
      files: ["src/writer/**/*.{js,jsx,ts,tsx}", "src/writer/**/*.d.ts"],
      rules: {
        "no-restricted-imports": [
          "warn",
          {
            patterns: writerRestrictedPatterns,
          },
        ],
      },
    },
    {
      files: ["src/shared/**/*.{js,jsx,ts,tsx}", "src/shared/**/*.d.ts"],
      rules: {
        "no-restricted-imports": [
          "warn",
          {
            patterns: sharedRestrictedPatterns,
          },
        ],
      },
    },
  ],
};
