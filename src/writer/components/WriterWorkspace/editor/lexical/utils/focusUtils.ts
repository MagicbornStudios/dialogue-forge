export function isKeyboardInput(e: React.MouseEvent | React.KeyboardEvent): boolean {
  return (e as any).detail === 0 || (e as any).detail === undefined;
}
