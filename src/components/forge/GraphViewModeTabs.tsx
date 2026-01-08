"use client"

import React from "react"
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import type { ViewMode } from "@/src/types"
import { VIEW_MODE } from "@/src/types/constants"

interface GraphViewModeTabsProps {
  value: ViewMode
  onChange: (value: ViewMode) => void
  graphLabel?: string
  yarnLabel?: string
  className?: string
}

export function GraphViewModeTabs({
  value,
  onChange,
  graphLabel = "Graph",
  yarnLabel = "Yarn",
  className,
}: GraphViewModeTabsProps) {
  return (
    <Tabs value={value} onValueChange={v => onChange(v as ViewMode)}>
      <TabsList className={className}>
        <TabsTrigger value={VIEW_MODE.GRAPH}>{graphLabel}</TabsTrigger>
        <TabsTrigger value={VIEW_MODE.YARN}>{yarnLabel}</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

