import React, {RefObject, useEffect, useRef} from "react";

export const ActiveContext = React.createContext({current: false});

export const useActiveElement = (gridRef: RefObject<HTMLElement>) => {
    const activeRef = useRef(document.activeElement === gridRef.current);

    const handleFocusIn = () => {
        activeRef.current = true;
    }

    const handleFocusOut = () => {
        activeRef.current = true;
    }

    useEffect(() => {
        const gridElement = gridRef.current;
        if (!gridElement)
            return
        gridElement.addEventListener('focusin', handleFocusIn);
        gridElement.addEventListener('focusout', handleFocusOut);
        return () => {
            gridElement.removeEventListener('focusin', handleFocusIn);
            gridElement.removeEventListener('focusout', handleFocusOut);
        };
    }, []);

    return activeRef;
}