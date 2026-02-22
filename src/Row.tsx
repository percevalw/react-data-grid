import React, { forwardRef } from 'react';
import type { RefAttributes, CSSProperties } from 'react';
import clsx from 'clsx';

import Cell from './Cell';
import { RowSelectionProvider, useLatestFunc/*, useCombinedRefs*/, useRovingRowRef } from './hooks';
import { getColSpan } from './utils';
import { rowClassname } from './style/row';
import type { RowRendererProps } from './types';

function Row<R, SR>(
  {
    className,
    rowIdx,
    selectedCellIdx,
    selectedCellRange,
    isRowSelected,
    copiedCellIdx,
    draggedOverCellIdx,
    lastFrozenColumnIndex,
    row,
    viewportColumns,
    selectedCellEditor,
    selectedCellDragHandle,
    onRowClick,
    onRowDoubleClick,
    rowClass,
    setDraggedOverRowIdx,
    onMouseEnter,
    top,
    height,
    onRowChange,
    selectCell,
    ...props
  }: RowRendererProps<R, SR>,
  ref: React.Ref<HTMLDivElement>
) {
  // const { ref: rowRef, tabIndex, className: rovingClassName } = useRovingRowRef(selectedCellIdx);
  const { className: rovingClassName } = useRovingRowRef(selectedCellIdx);

  const handleRowChange = useLatestFunc((newRow: R) => {
    onRowChange(rowIdx, newRow);
  });

  function handleDragEnter(event: React.MouseEvent<HTMLDivElement>) {
    setDraggedOverRowIdx?.(rowIdx);
    onMouseEnter?.(event);
  }

  className = clsx(
    rowClassname,
    `rdg-row-${rowIdx % 2 === 0 ? 'even' : 'odd'}`,
    rovingClassName,
    rowClass?.(row),
    className
  );

  const cells = [];

  for (let index = 0; index < viewportColumns.length; index++) {
    const column = viewportColumns[index];
    const { idx } = column;
    const colSpan = getColSpan(column, lastFrozenColumnIndex, { type: 'ROW', row });
    if (colSpan !== undefined) {
      index += colSpan - 1;
    }

    const isCellSelected = selectedCellIdx === idx;
    const isCellWithinSelectionRange =
      selectedCellRange != null &&
      idx >= selectedCellRange.startIdx &&
      idx <= selectedCellRange.endIdx;

    if (isCellSelected && selectedCellEditor) {
      cells.push(selectedCellEditor);
    } else {
      cells.push(
        <Cell
          key={column.key}
          column={column}
          colSpan={colSpan}
          row={row}
          rowIdx={rowIdx}
          isCopied={copiedCellIdx === idx}
          isDraggedOver={draggedOverCellIdx === idx}
          isCellSelected={isCellSelected}
          isCellWithinSelectionRange={isCellWithinSelectionRange}
          dragHandle={isCellSelected ? selectedCellDragHandle : undefined}
          onRowClick={onRowClick}
          onRowDoubleClick={onRowDoubleClick}
          onRowChange={handleRowChange}
          selectCell={selectCell}
        />
      );
    }
  }

  return (
    <RowSelectionProvider value={isRowSelected}>
      <div
        role="row"
        // ref={useCombinedRefs(ref}
        tabIndex={selectedCellIdx === -1 ? 0 : -1}
        className={className}
        onMouseEnter={handleDragEnter}
        style={
          {
            top,
            '--row-height': `${height}px`
          } as unknown as CSSProperties
        }
        {...props}
      >
        {cells}
      </div>
    </RowSelectionProvider>
  );
}

export default Row as <R, SR>(props: RowRendererProps<R, SR>) => JSX.Element;

export const RowWithRef = forwardRef(Row) as <R, SR>(
  props: RowRendererProps<R, SR> & RefAttributes<HTMLDivElement>
) => JSX.Element;
