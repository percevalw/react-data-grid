import { css } from '@linaria/core';
import { row } from './row';

const lightTheme = `
  --color: #000;
  --border-color: #ddd;
  --summary-border-color: #aaa;
  --background-color: hsl(0deg 0% 100%);
  --header-background-color: hsl(0deg 0% 97.5%);
  --row-hover-background-color: hsl(0deg 0% 96%);
  --row-selected-background-color: hsl(207deg 76% 92%);
  --row-selected-hover-background-color: hsl(207deg 76% 88%);

  --checkbox-color: hsl(207deg 100% 29%);
  --checkbox-focus-color: hsl(207deg 100% 69%);
  --checkbox-disabled-border-color: #ccc;
  --checkbox-disabled-background-color: #ddd;
`;

const darkTheme = `
  --color: #ddd;
  --border-color: #444;
  --summary-border-color: #555;
  --background-color: hsl(0deg 0% 13%);
  --header-background-color: hsl(0deg 0% 10.5%);
  --row-hover-background-color: hsl(0deg 0% 9%);
  --row-selected-background-color: hsl(207deg 76% 42%);
  --row-selected-hover-background-color: hsl(207deg 76% 38%);

  --checkbox-color: hsl(207deg 100% 79%);
  --checkbox-focus-color: hsl(207deg 100% 89%);
  --checkbox-disabled-border-color: #000;
  --checkbox-disabled-background-color: #333;
`;

const root = css`
  @media (prefers-color-scheme: light) {
     & {
      ${lightTheme}
    }
  }
  @media (prefers-color-scheme: dark) {
     & {
      ${darkTheme}
    }
  }
  
  &.rdg-dark, :root[data-theme='dark'] & {
    --color-scheme: dark;
    ${darkTheme}
  }

  &.rdg-light, :root[data-theme='light'] & {
    --color-scheme: light;
    ${lightTheme}
  }

  
  --selection-color: #66afe9;
  --font-size: 1rem;

  color-scheme: var(--color-scheme, light dark);

  /* https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context */
  /* We set a stacking context so internal elements don't render on top of external components. */
  contain: strict;
  contain: size layout style paint;
  content-visibility: auto;
  height: 350px;
  border: 1px solid var(--border-color);
  box-sizing: border-box;
  overflow: auto;
  user-select: none;
  background-color: var(--background-color);
  color: var(--color);
  font-size: var(--font-size);
  direction: ltr;

  /* set stacking context in safari */
  @supports not (contain: strict) {
    position: relative;
    z-index: 0;
  }

  *,
  *::before,
  *::after {
    box-sizing: inherit;
  }
`;

export const rootClassname = `rdg ${root}`;

const viewportDragging = css`
  &.${row} {
    cursor: move;
  }
`;

export const viewportDraggingClassname = `rdg-viewport-dragging ${viewportDragging}`;
