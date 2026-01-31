import { createDefaultPlaceholderElement } from '../elements';

export { createDefaultPlaceholderElement as createCharacterElement } from '../elements';

export function createBlankPlaceholderElement() {
  console.log('createBlankPlaceholderElement');
  return createDefaultPlaceholderElement('blank-circle', { x: 0, y: 0 });
}
