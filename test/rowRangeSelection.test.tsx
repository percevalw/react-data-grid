import React, { StrictMode, useState } from 'react';
import { fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DataGrid from '../src';
import type { Column } from '../src';
import { getCellsAtRowIndex, getRows } from './utils';

interface Row {
  id: number;
  name: string;
}

interface GridSelection {
  rowIdx: number;
  idx: number;
  mode: 'EDIT' | 'SELECT';
  ranges?: readonly { rowIdx: number }[];
}

const columns: readonly Column<Row>[] = [
  { key: 'id', name: 'ID' },
  { key: 'name', name: 'Name' }
];

const rows: readonly Row[] = [
  { id: 1, name: 'A' },
  { id: 2, name: 'B' },
  { id: 3, name: 'C' }
];

function TestGrid() {
  const [selection, setSelection] = useState<GridSelection>({
    rowIdx: -2,
    idx: -1,
    mode: 'SELECT'
  });

  return (
    <DataGrid
      columns={columns}
      rows={rows}
      selection={selection}
      multiSelectionMode="rows"
      onSelectionChange={setSelection}
    />
  );
}

test('keeps row range selection when shift is released before click', () => {
  render(
    <StrictMode>
      <TestGrid />
    </StrictMode>
  );

  userEvent.click(getCellsAtRowIndex(0)[0]);

  const targetCell = getCellsAtRowIndex(2)[0];
  fireEvent.mouseDown(targetCell, { button: 0, shiftKey: true });
  fireEvent.mouseUp(targetCell, { button: 0 });
  fireEvent.click(targetCell, { button: 0 });

  const renderedRows = getRows();
  expect(renderedRows[0]).toHaveAttribute('aria-selected', 'true');
  expect(renderedRows[1]).toHaveAttribute('aria-selected', 'true');
  expect(renderedRows[2]).toHaveAttribute('aria-selected', 'true');
});
