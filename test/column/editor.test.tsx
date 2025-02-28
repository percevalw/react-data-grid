import { StrictMode, useMemo, useState } from 'react';
import { act, fireEvent, render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DataGrid from '../../src';
import type { Column } from '../../src';
import { getCellsAtRowIndex, getGrid } from '../utils';
import { createPortal } from 'react-dom';

interface Row {
  col1: number;
  col2: string;
}

describe('Editor', () => {
  it('should open editor on double click', () => {
    render(<EditorTest />);
    userEvent.click(getCellsAtRowIndex(0)[0]);
    expect(screen.queryByLabelText('col1-editor')).not.toBeInTheDocument();
    userEvent.dblClick(getCellsAtRowIndex(0)[0]);
    expect(screen.getByLabelText('col1-editor')).toHaveValue(1);
    userEvent.type(document.activeElement!, '2');
    userEvent.tab();
    expect(screen.queryByLabelText('col1-editor')).not.toBeInTheDocument();
    expect(getCellsAtRowIndex(0)[0]).toHaveTextContent(/^12$/);
  });

  it('should open and commit changes on enter', () => {
    render(<EditorTest />);
    userEvent.click(getCellsAtRowIndex(0)[0]);
    expect(screen.queryByLabelText('col1-editor')).not.toBeInTheDocument();
    userEvent.keyboard('{enter}');
    expect(screen.getByLabelText('col1-editor')).toHaveValue(1);
    userEvent.keyboard('3{enter}');
    expect(getCellsAtRowIndex(0)[0]).toHaveTextContent(/^13$/);
    expect(screen.queryByLabelText('col1-editor')).not.toBeInTheDocument();
  });

  it('should open editor when user types', () => {
    render(<EditorTest />);
    userEvent.click(getCellsAtRowIndex(0)[0]);
    userEvent.keyboard('123{enter}');
    expect(getCellsAtRowIndex(0)[0]).toHaveTextContent(/^1123$/);
  });

  it('should close editor and discard changes on escape', () => {
    render(<EditorTest />);
    userEvent.dblClick(getCellsAtRowIndex(0)[0]);
    expect(screen.getByLabelText('col1-editor')).toHaveValue(1);
    userEvent.keyboard('2222{escape}');
    expect(screen.queryByLabelText('col1-editor')).not.toBeInTheDocument();
    expect(getCellsAtRowIndex(0)[0]).toHaveTextContent(/^1$/);
  });

  it('should commit changes and close editor when clicked outside', async () => {
    render(<EditorTest />);
    userEvent.dblClick(getCellsAtRowIndex(0)[0]);
    expect(screen.getByLabelText('col1-editor')).toHaveValue(1);
    userEvent.keyboard('2222');
    userEvent.click(screen.getByText('outside'));
    await waitForElementToBeRemoved(screen.queryByLabelText('col1-editor'));
    expect(getCellsAtRowIndex(0)[0]).toHaveTextContent(/^12222$/);
  });

  it('should commit quickly enough on outside clicks so click event handlers access the latest rows state', async () => {
    const onSave = jest.fn();
    render(<EditorTest onSave={onSave} />);
    userEvent.dblClick(getCellsAtRowIndex(0)[0]);
    userEvent.keyboard('234');
    expect(onSave).not.toHaveBeenCalled();
    const saveButton = screen.getByRole('button', { name: 'save' });
    fireEvent.mouseDown(saveButton);
    // userEvent.click() triggers both mousedown and click, but without delay,
    // which isn't realistic, and isn't enough to trigger outside click detection
    await act(async () => {
      await new Promise(requestAnimationFrame);
    });
    fireEvent.click(saveButton);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith([
      { col1: 1234, col2: 'a1' },
      { col1: 2, col2: 'a2' }
    ]);
  });

  it('should scroll to the editor if selected cell is not in the viewport', () => {
    const rows: Row[] = [];
    for (let i = 0; i < 99; i++) {
      rows.push({ col1: i, col2: `${i}` });
    }

    render(<EditorTest gridRows={rows} />);
    userEvent.click(getCellsAtRowIndex(0)[0]);
    expect(getCellsAtRowIndex(0)).toHaveLength(2);

    const grid = getGrid();
    grid.scrollTop = 2000;
    expect(getCellsAtRowIndex(0)).toHaveLength(1);
    expect(screen.queryByLabelText('col1-editor')).not.toBeInTheDocument();
    userEvent.keyboard('123');
    expect(screen.getByLabelText('col1-editor')).toHaveValue(123);
    userEvent.keyboard('{enter}');
    expect(getCellsAtRowIndex(0)).toHaveLength(2);
  });

  describe('editable', () => {
    it('should be editable if an editor is specified and editable is undefined/null', () => {
      render(<EditorTest />);
      userEvent.dblClick(getCellsAtRowIndex(0)[1]);
      expect(screen.getByLabelText('col2-editor')).toBeInTheDocument();
    });

    it('should be editable if an editor is specified and editable is set to true', () => {
      render(<EditorTest editable />);
      userEvent.dblClick(getCellsAtRowIndex(0)[1]);
      expect(screen.getByLabelText('col2-editor')).toBeInTheDocument();
    });

    it('should not be editable if editable is false', () => {
      render(<EditorTest editable={false} />);
      userEvent.dblClick(getCellsAtRowIndex(0)[1]);
      expect(screen.queryByLabelText('col2-editor')).not.toBeInTheDocument();
    });

    it('should not be editable if editable function returns false', () => {
      render(<EditorTest editable={(row) => row.col1 === 2} />);
      userEvent.dblClick(getCellsAtRowIndex(0)[1]);
      expect(screen.queryByLabelText('col2-editor')).not.toBeInTheDocument();

      userEvent.dblClick(getCellsAtRowIndex(1)[1]);
      expect(screen.getByLabelText('col2-editor')).toBeInTheDocument();
    });
  });

  describe('editorOptions', () => {
    it('should open editor on single click if editOnClick is true', () => {
      render(
        <EditorTest
          editorOptions={{
            editOnClick: true
          }}
        />
      );
      userEvent.click(getCellsAtRowIndex(0)[0]);
      expect(screen.queryByLabelText('col1-editor')).not.toBeInTheDocument();
      userEvent.click(getCellsAtRowIndex(0)[1]);
      expect(screen.getByLabelText('col2-editor')).toBeInTheDocument();
    });

    it('should detect outside click if editor is rendered in a portal', async () => {
      render(<EditorTest createEditorPortal editorOptions={{ renderFormatter: true }} />);
      userEvent.dblClick(getCellsAtRowIndex(0)[1]);
      const editor = screen.getByLabelText('col2-editor');
      expect(editor).toHaveValue('a1');
      userEvent.keyboard('23');
      // The cell value should update as the editor value is changed
      expect(getCellsAtRowIndex(0)[1]).toHaveTextContent('a123');
      // clicking in a portal does not count as an outside click
      userEvent.click(editor);
      expect(editor).toBeInTheDocument();
      // true outside clicks are still detected
      userEvent.click(screen.getByText('outside'));
      await waitForElementToBeRemoved(editor);
    });

    it('should not commit on outside click if commitOnOutsideClick is false', async () => {
      render(
        <EditorTest
          editorOptions={{
            commitOnOutsideClick: false
          }}
        />
      );
      userEvent.dblClick(getCellsAtRowIndex(0)[1]);
      const editor = screen.getByLabelText('col2-editor');
      expect(editor).toBeInTheDocument();
      userEvent.click(screen.getByText('outside'));
      await act(async () => {
        await new Promise(requestAnimationFrame);
      });
      expect(editor).toBeInTheDocument();
      userEvent.click(editor);
      userEvent.keyboard('{enter}');
      expect(editor).not.toBeInTheDocument();
    });

    it('should not open editor if onCellKeyDown prevents the default event', () => {
      render(
        <EditorTest
          editorOptions={{
            onCellKeyDown(event) {
              if (event.key === 'x') {
                event.preventDefault();
              }
            }
          }}
        />
      );
      userEvent.click(getCellsAtRowIndex(0)[1]);
      userEvent.keyboard('yz{enter}');
      expect(getCellsAtRowIndex(0)[1]).toHaveTextContent(/^a1yz$/);
      userEvent.keyboard('x');
      expect(screen.queryByLabelText('col2-editor')).not.toBeInTheDocument();
    });

    it('should prevent navigation if onNavigation returns false', () => {
      render(
        <EditorTest
          editorOptions={{
            onNavigation(event) {
              return event.key === 'ArrowDown';
            }
          }}
        />
      );
      userEvent.dblClick(getCellsAtRowIndex(0)[1]);
      userEvent.keyboard('a{arrowleft}b{arrowright}c{arrowdown}'); // should commit changes on arrowdown
      expect(getCellsAtRowIndex(0)[1]).toHaveTextContent(/^a1bac$/);
    });
  });

  it.skip('should not steal focus back to the cell after being closed by clicking outside the grid', async () => {
    const column: Column<unknown> = {
      key: 'col',
      name: 'Column',
      editor() {
        return <input value="123" readOnly autoFocus />;
      }
    };

    render(
      <>
        <input value="abc" readOnly />
        <DataGrid columns={[column]} rows={[{}]} />
      </>
    );

    userEvent.dblClick(getCellsAtRowIndex(0)[0]);
    const editorInput = screen.getByDisplayValue('123');
    const outerInput = screen.getByDisplayValue('abc');
    expect(editorInput).toHaveFocus();
    userEvent.click(outerInput);
    expect(outerInput).toHaveFocus();
    await waitForElementToBeRemoved(editorInput);
    expect(outerInput).toHaveFocus();
  });
});

interface EditorTestProps extends Pick<Column<Row>, 'editorOptions' | 'editable'> {
  onSave?: (rows: readonly Row[]) => void;
  gridRows?: readonly Row[];
  createEditorPortal?: boolean;
}

const initialRows: readonly Row[] = [
  {
    col1: 1,
    col2: 'a1'
  },
  {
    col1: 2,
    col2: 'a2'
  }
];

function EditorTest({
  editable,
  editorOptions,
  onSave,
  gridRows = initialRows,
  createEditorPortal
}: EditorTestProps) {
  const [rows, setRows] = useState(gridRows);

  const columns = useMemo((): readonly Column<Row>[] => {
    return [
      {
        key: 'col1',
        name: 'Col1',
        editor(p) {
          return (
            <input
              autoFocus
              type="number"
              aria-label="col1-editor"
              value={p.row.col1}
              onChange={(e) => p.onRowChange({ ...p.row, col1: e.target.valueAsNumber })}
            />
          );
        }
      },
      {
        key: 'col2',
        name: 'Col2',
        editable,
        editor({ row, onRowChange }) {
          const editor = (
            <input
              autoFocus
              aria-label="col2-editor"
              value={row.col2}
              onChange={(e) => onRowChange({ ...row, col2: e.target.value })}
            />
          );

          return createEditorPortal ? createPortal(editor, document.body) : editor;
        },
        editorOptions
      }
    ];
  }, [editable, editorOptions, createEditorPortal]);

  return (
    <StrictMode>
      <div
        onClick={(e) => e.stopPropagation()}
        onClickCapture={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseDownCapture={(e) => e.stopPropagation()}
      >
        outside
      </div>
      <button type="button" onClick={() => onSave?.(rows)}>
        save
      </button>
      <DataGrid columns={columns} rows={rows} onRowsChange={setRows} />
    </StrictMode>
  );
}
