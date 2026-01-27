/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {Provider} from '@lexical/yjs';
import {WebsocketProvider} from 'y-websocket';
import {Doc} from 'yjs';

const getWebsocketConfig = () => {
  if (typeof window === 'undefined') {
    return {
      endpoint: 'ws://localhost:1234',
      slug: 'playground',
      id: '0',
    };
  }
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  return {
    endpoint: params.get('collabEndpoint') || 'ws://localhost:1234',
    slug: 'playground',
    id: params.get('collabId') || '0',
  };
};

// parent dom -> child doc
export function createWebsocketProvider(
  id: string,
  yjsDocMap: Map<string, Doc>,
): Provider {
  let doc = yjsDocMap.get(id);

  if (doc === undefined) {
    doc = new Doc();
    yjsDocMap.set(id, doc);
  } else {
    doc.load();
  }

  return createWebsocketProviderWithDoc(id, doc);
}

export function createWebsocketProviderWithDoc(id: string, doc: Doc): Provider {
  const config = getWebsocketConfig();
  // @ts-expect-error
  return new WebsocketProvider(
    config.endpoint,
    config.slug + '/' + config.id + '/' + id,
    doc,
    {
      connect: false,
    },
  );
}
