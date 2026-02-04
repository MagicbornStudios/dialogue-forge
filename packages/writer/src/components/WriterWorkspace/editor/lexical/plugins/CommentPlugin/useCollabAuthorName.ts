import { useCollaborationContext } from '@lexical/react/LexicalCollaborationContext';

export function useCollabAuthorName(): string {
  const collabContext = useCollaborationContext();
  const { yjsDocMap, name } = collabContext;
  return yjsDocMap.has('comments') ? name : 'Playground User';
}
