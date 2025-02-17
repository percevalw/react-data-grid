import { useContext, useRef, useState } from 'react';
import { useLayoutEffect } from './useLayoutEffect';
import {ActiveContext} from "./useActiveElement";

// https://www.w3.org/TR/wai-aria-practices-1.1/#kbd_roving_tabindex
export function useRovingCellRef(isSelected: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  // https://www.w3.org/TR/wai-aria-practices-1.1/#gridNav_focus
  const isChildFocused = useRef(false);
  const [, forceRender] = useState<unknown>({});
  const activeRef = useContext(ActiveContext);

  useLayoutEffect(() => {
    if (!isSelected) {
      isChildFocused.current = false;
      return;
    }

    if (isChildFocused.current) {
      // When the child is focused, we need to rerender
      // the cell again so tabIndex is updated to -1
      forceRender({});
      return;
    }
    if (activeRef.current)
      ref.current?.focus();
  }, [isSelected]);

  function onFocus(event: React.FocusEvent<HTMLDivElement>) {
    if (event.target !== ref.current) {
      isChildFocused.current = true;
    }
  }

  const isFocused = isSelected && !isChildFocused.current;

  return {
    ref,
    tabIndex: isFocused ? 0 : -1,
    onFocus
  };
}
