# GamePlayer Engine

## Overview

The GamePlayer engine is responsible for executing `ForgeGraphDoc` graphs at runtime. This directory contains the execution engine implementation and strategy documentation.

## Structure

```
engine/
├── README.md                    # This file
├── docs/                        # Execution strategy documentation
│   ├── execution-strategy.md   # Comparison of execution approaches
│   ├── yarn-vm-research.md     # Yarn Spinner VM research
│   ├── forge-execution-analysis.md  # ForgeGraphDoc execution analysis
│   └── execution-recommendation.md  # Final recommendation
└── [future implementation files]
```

## Current Status

The execution strategy is under research. See `docs/` for detailed analysis and recommendations.

## Key Questions

1. Should we use Yarn Spinner's VM directly?
2. Should we execute ForgeGraphDoc directly?
3. Should we use a hybrid approach?

## Next Steps

1. Complete execution strategy research
2. Make recommendation
3. Implement chosen approach
4. Integrate with GamePlayer UI


## Visuals (BabylonJS)

Visual presentation is implemented as a **BabylonJS scene runtime** driven by execution events (Scene Cues).  
See `docs/gameplayer-babylonjs.md` for the VN Stage Template, cue vocabulary, and storylet visual policies.
