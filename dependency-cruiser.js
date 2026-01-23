module.exports = {
  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    exclude: {
      path: 'node_modules|dist|.next|docs'
    },
    tsConfig: {
      fileName: 'tsconfig.json'
    },
    enhancedResolveOptions: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']
    },
    outputType: ['json', 'dot'],
    outputTo: [
      'docs/architecture/reports/deps/dependency-cruiser.json',
      'docs/architecture/reports/deps/dependency-cruiser.dot'
    ]
  },
  rules: [
    {
      name: 'src-no-app-dependency',
      severity: 'error',
      from: {
        path: '^src/'
      },
      to: {
        path: '^app/'
      }
    },
    {
      name: 'src-no-payload-types',
      severity: 'error',
      from: {
        path: '^src/'
      },
      to: {
        path: 'payload-types'
      }
    },
    {
      name: 'shared-isolation',
      severity: 'error',
      from: {
        path: '^src/shared/'
      },
      to: {
        path: '^src/(forge|writer|ai)/'
      }
    },
    {
      name: 'forge-no-writer-dependency',
      severity: 'error',
      from: {
        path: '^src/forge/'
      },
      to: {
        path: '^src/writer/'
      }
    },
    {
      name: 'writer-no-forge-dependency',
      severity: 'error',
      from: {
        path: '^src/writer/'
      },
      to: {
        path: '^src/forge/'
      }
    },
    {
      name: 'ai-only-imports-shared',
      severity: 'error',
      from: {
        path: '^src/ai/'
      },
      to: {
        path: '^src/(forge|writer)/'
      }
    }
  ]
};
