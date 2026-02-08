'use client';

import React, { createContext, useContext } from 'react';

export type ForgePayloadClient = {
  find(args: {
    collection: string;
    where?: Record<string, unknown>;
    limit?: number;
    depth?: number;
  }): Promise<{ docs: unknown[] }>;
  findByID(args: {
    collection: string;
    id: number | string;
    depth?: number;
  }): Promise<unknown>;
  create(args: {
    collection: string;
    data: Record<string, unknown>;
  }): Promise<unknown>;
  update(args: {
    collection: string;
    id: number | string;
    data: Record<string, unknown>;
  }): Promise<unknown>;
  delete(args: {
    collection: string;
    id: number | string;
  }): Promise<unknown>;
};

const ForgePayloadContext = createContext<ForgePayloadClient | null>(null);

export function ForgePayloadProvider({
  client,
  children,
}: {
  client: ForgePayloadClient;
  children: React.ReactNode;
}) {
  return (
    <ForgePayloadContext.Provider value={client}>
      {children}
    </ForgePayloadContext.Provider>
  );
}

export function useForgePayloadClient(): ForgePayloadClient {
  const client = useContext(ForgePayloadContext);
  if (!client) {
    throw new Error(
      'useForgePayloadClient must be used within ForgePayloadProvider'
    );
  }
  return client;
}
