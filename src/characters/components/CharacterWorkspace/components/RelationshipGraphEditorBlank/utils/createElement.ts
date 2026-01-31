import { createDefaultPlaceholderElement } from '../elements';

export { createDefaultPlaceholderElement as createCharacterElement } from '../elements';

export function createBlankPlaceholderElement() {
  return createDefaultPlaceholderElement('blank-circle', { x: 370, y: 270 });
}
