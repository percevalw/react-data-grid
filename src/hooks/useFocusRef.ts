import { useContext, useRef } from 'react';
import { useLayoutEffect } from './useLayoutEffect';
import {ActiveContext} from "./useActiveElement";

export function useFocusRef<T extends HTMLOrSVGElement>(isSelected: boolean) {
  const ref = useRef<T>(null);
  const activeRef = useContext(ActiveContext);

  useLayoutEffect(() => {
    if (!isSelected) return;
    if (activeRef.current)
      ref.current?.focus({ preventScroll: true });
  }, [isSelected]);

  return {
    ref,
    tabIndex: isSelected ? 0 : -1
  };
}
