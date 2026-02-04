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
        path: '^packages/(shared|runtime|forge|writer|video|characters|ai)/src/'
      },
      to: {
        path: '^apps/host/'
      }
    },
    {
      name: 'src-no-payload-types',
      severity: 'error',
      from: {
        path: '^packages/(shared|runtime|forge|writer|video|characters|ai)/src/'
      },
      to: {
        path: 'payload-types'
      }
    },
    {
      name: 'shared-isolation',
      severity: 'error',
      from: {
        path: '^packages/shared/src/'
      },
      to: {
        path: '^packages/(runtime|forge|writer|ai|video|characters)/src/'
      }
    },
    {
      name: 'runtime-isolation',
      severity: 'error',
      from: {
        path: '^packages/runtime/src/'
      },
      to: {
        path: '^packages/(forge|writer|ai|video|characters)/src/'
      }
    },
    {
      name: 'forge-no-cross-domain',
      severity: 'error',
      from: {
        path: '^packages/forge/src/'
      },
      to: {
        path: '^packages/(writer|characters)/src/'
      }
    },
    {
      name: 'writer-no-cross-domain',
      severity: 'error',
      from: {
        path: '^packages/writer/src/'
      },
      to: {
        path: '^packages/(forge|video|characters)/src/'
      }
    },
    {
      name: 'ai-only-imports-shared',
      severity: 'error',
      from: {
        path: '^packages/ai/src/'
      },
      to: {
        path: '^packages/(forge|writer|video|characters|runtime)/src/'
      }
    }
  ]
};
