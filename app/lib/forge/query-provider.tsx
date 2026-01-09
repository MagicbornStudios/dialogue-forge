"use client"

import { QueryClient, QueryClientProvider as RQProvider } from "@tanstack/react-query"
import { useState } from "react"

export function QueryClientProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            retry: 2,
            refetchOnWindowFocus: false, // Don't refetch on window focus for editor
          },
        },
      })
  )

  return <RQProvider client={queryClient}>{children}</RQProvider>
}
