import { useState } from 'react'
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'
import type { MRT_ColumnDef, MRT_RowData } from 'material-react-table'

import './Grid.css'

// Dark theme that mirrors the app's CSS custom properties (see src/index.css). MUI's palette needs
// literal, parseable colors (it computes tints/shades from them), so the values below are copied from
// index.css rather than referencing the `var(--...)` custom properties directly.
const gridTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#111c34', paper: '#111c34' },
    text: { primary: '#d5d8de', secondary: '#95a1af' },
    primary: { main: '#38bdf8' },
    error: { main: '#f87171' },
    divider: 'rgba(148, 163, 184, 0.2)',
  },
  typography: { fontFamily: 'var(--sans)' },
})

export type GridColumnAlign = 'left' | 'center' | 'right'

export interface GridColumn<TRow extends MRT_RowData> {
  /** Unique identifier for the column, used as the React key and for class hooks. */
  readonly key: string
  /** Content rendered in the column header cell. */
  readonly header: ReactNode
  /** Property of the row to read when no custom `render` is provided. */
  readonly accessor?: keyof TRow
  /** Custom cell renderer, takes precedence over `accessor`. */
  readonly render?: (row: TRow, rowIndex: number) => ReactNode
  /** Horizontal alignment applied to both the header and body cells. Defaults to `left`. */
  readonly align?: GridColumnAlign
  /** CSS width applied to the column, e.g. `'10rem'` or `'20%'`. */
  readonly width?: string
  readonly headerClassName?: string
  readonly cellClassName?: string
  /**
   * Marks the column as inline-editable. While a row is being edited, this column renders a text input bound to
   * `accessor` instead of its normal content. Requires `accessor` unless `renderEditor` is provided. Ignored when
   * `enableEditing` is not set on the Grid.
   */
  readonly editable?: boolean
  /**
   * Custom editor rendered for this column while its row is being edited, instead of the default text input.
   * Call `onChange` with a partial row patch to update the row's in-progress edit draft.
   */
  readonly renderEditor?: (row: TRow, onChange: (patch: Partial<TRow>) => void, rowIndex: number) => ReactNode
}

export interface GridProps<TRow extends MRT_RowData> {
  /** Description of every column to render, in display order. */
  readonly columns: ReadonlyArray<GridColumn<TRow>>
  /**
   * Initial rows to seed the Grid's own internal row state with. The Grid owns add/edit/delete afterwards
   * (it's an uncontrolled component, similar to an `<input defaultValue>`): further changes to this array
   * after the first render are not picked up automatically.
   */
  readonly defaultData: ReadonlyArray<TRow>
  /** Derives a stable React key for a given row. */
  readonly getRowKey: (row: TRow, rowIndex: number) => string | number
  readonly caption?: ReactNode
  /** Shown instead of rows when there are none. Defaults to a generic message. */
  readonly emptyMessage?: ReactNode
  /** Shown instead of rows while data is being fetched. */
  readonly isLoading?: boolean
  readonly loadingMessage?: ReactNode
  readonly className?: string
  /** Called when a row is activated via click, Enter or Space. Rows become focusable when provided. */
  readonly onRowClick?: (row: TRow, rowIndex: number) => void
  /** Derives an additional class name for a given row. */
  readonly rowClassName?: (row: TRow, rowIndex: number) => string | undefined
  /**
   * Builds a new row when the toolbar "Add" action is activated, given the Grid's current rows (e.g. to derive
   * a unique id). The toolbar is only rendered when provided. The Grid appends the returned row to its own
   * internal state; `onAddRow` is only an optional notification hook, not what performs the mutation.
   */
  readonly createRow?: (existingRows: ReadonlyArray<TRow>) => TRow
  /** Label for the add-row toolbar button. Defaults to `'Add'`. */
  readonly addRowLabel?: ReactNode
  /** Called after the Grid has appended a newly-created row to its internal state, e.g. to sync external state. */
  readonly onAddRow?: (newRow: TRow, rows: ReadonlyArray<TRow>) => void
  /**
   * Enables inline row editing (Edit/Save/Cancel actions). Editing a row switches its editable columns into
   * inputs directly in place (see `GridColumn.editable`/`renderEditor`) and the Grid merges the saved draft
   * into its own internal row state; `onSaveRow` is only an optional notification hook.
   */
  readonly enableEditing?: boolean
  /** Label for the edit action button that enters inline edit mode. Defaults to `'Edit'`. */
  readonly editRowLabel?: ReactNode
  /** Label for the button that saves an in-progress inline edit. Defaults to `'Save'`. */
  readonly saveRowLabel?: ReactNode
  /** Label for the button that discards an in-progress inline edit. Defaults to `'Cancel'`. */
  readonly cancelEditLabel?: ReactNode
  /**
   * Called after the Grid has merged an edited row into its internal state, with the edited draft row, the
   * original row, and the row index, e.g. to sync external state.
   */
  readonly onSaveRow?: (updatedRow: TRow, originalRow: TRow, rowIndex: number) => void
  /**
   * Enables the row "Delete" action. Unless `getDeleteConfirmMessage` resolves to `null`, deleting a row first
   * shows an inline "Confirm"/"Cancel" step in place of the row's actions rather than a blocking native dialog.
   * The Grid removes the row from its own internal state; `onDeleteRow` is only an optional notification hook.
   */
  readonly enableDeleting?: boolean
  /** Label for the delete action button. Defaults to `'Delete'`. */
  readonly deleteRowLabel?: ReactNode
  /** Label for the inline delete-confirmation button. Defaults to `'Confirm'`. */
  readonly confirmDeleteLabel?: ReactNode
  /** Label for the inline delete-cancellation button. Defaults to `'Cancel'`. */
  readonly cancelDeleteLabel?: ReactNode
  /** Called after the Grid has removed a row from its internal state, e.g. to sync external state. */
  readonly onDeleteRow?: (row: TRow, rowIndex: number) => void
  /** Header label for the actions column shown when `enableEditing` and/or `enableDeleting` are set. */
  readonly actionsHeader?: ReactNode
  /**
   * Returns the message shown next to the inline "Confirm"/"Cancel" delete step, or `null` to delete immediately
   * without an inline confirmation step. Defaults to a generic confirmation prompt.
   */
  readonly getDeleteConfirmMessage?: (row: TRow, rowIndex: number) => string | null
}

function joinClassNames(...classNames: ReadonlyArray<string | undefined | false>) {
  return classNames.filter(Boolean).join(' ')
}

export function Grid<TRow extends MRT_RowData>(props: GridProps<TRow>) {
  // useMaterialReactTable (called inside GridInner) resolves the ambient MUI theme via context at the
  // point it's invoked, so the ThemeProvider must wrap GridInner as an ancestor rather than only the
  // JSX that GridInner itself returns.
  return (
    <ThemeProvider theme={gridTheme}>
      <GridInner {...props} />
    </ThemeProvider>
  )
}

function GridInner<TRow extends MRT_RowData>({
  columns,
  defaultData,
  getRowKey,
  caption,
  emptyMessage = 'No data to display.',
  isLoading = false,
  loadingMessage = 'Loading…',
  className,
  onRowClick,
  rowClassName,
  createRow,
  addRowLabel = 'Add',
  onAddRow,
  enableEditing = false,
  editRowLabel = 'Edit',
  saveRowLabel = 'Save',
  cancelEditLabel = 'Cancel',
  onSaveRow,
  enableDeleting = false,
  deleteRowLabel = 'Delete',
  confirmDeleteLabel = 'Confirm',
  cancelDeleteLabel = 'Cancel',
  onDeleteRow,
  actionsHeader = 'Actions',
  getDeleteConfirmMessage = () => 'Are you sure you want to delete this row?',
}: GridProps<TRow>) {
  // The Grid is uncontrolled: `defaultData` only seeds the initial rows, then all add/edit/delete mutations
  // happen against this internal copy. `onAddRow`/`onSaveRow`/`onDeleteRow` are notified afterwards so a
  // consumer can mirror the change into its own state (e.g. other UI fed by the same data), but they don't
  // perform the mutation themselves.
  const [rows, setRows] = useState<TRow[]>(() => [...defaultData])
  const [pendingDeleteKey, setPendingDeleteKey] = useState<string | number | null>(null)
  const [editingKey, setEditingKey] = useState<string | number | null>(null)
  const [draftRow, setDraftRow] = useState<TRow | null>(null)
  const isClickable = typeof onRowClick === 'function'
  const hasRowActions = enableEditing || enableDeleting

  function renderCellContent(column: GridColumn<TRow>, row: TRow, rowIndex: number): ReactNode {
    if (column.render) {
      return column.render(row, rowIndex)
    }
    if (column.accessor) {
      const value = row[column.accessor]
      return value === null || value === undefined ? null : String(value)
    }
    return null
  }

  function renderDefaultEditor(column: GridColumn<TRow>, row: TRow): ReactNode {
    if (!column.accessor) {
      return null
    }
    const accessor = column.accessor
    const value = row[accessor]
    return (
      <input
        type="text"
        className="grid__edit-input"
        value={value === null || value === undefined ? '' : String(value)}
        onChange={(event) =>
          handleDraftChange({ [accessor]: event.target.value } as unknown as Partial<TRow>)
        }
      />
    )
  }

  function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, row: TRow, rowIndex: number) {
    if (!onRowClick) {
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onRowClick(row, rowIndex)
    }
  }

  function handleAddClick() {
    if (!createRow) {
      return
    }
    const newRow = createRow(rows)
    const nextRows = [...rows, newRow]
    setRows(nextRows)
    onAddRow?.(newRow, nextRows)
  }

  function handleEditClick(event: MouseEvent<HTMLButtonElement>, row: TRow, rowIndex: number) {
    event.stopPropagation()
    setPendingDeleteKey(null)
    setEditingKey(getRowKey(row, rowIndex))
    setDraftRow({ ...row })
  }

  function handleDraftChange(patch: Partial<TRow>) {
    setDraftRow((current) => (current ? { ...current, ...patch } : current))
  }

  function handleSaveClick(event: MouseEvent<HTMLButtonElement>, row: TRow, rowIndex: number) {
    event.stopPropagation()
    if (draftRow) {
      const updatedRow = draftRow
      const targetKey = getRowKey(row, rowIndex)
      setRows((current) => current.map((item, index) => (getRowKey(item, index) === targetKey ? updatedRow : item)))
      onSaveRow?.(updatedRow, row, rowIndex)
    }
    setEditingKey(null)
    setDraftRow(null)
  }

  function handleCancelEditClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    setEditingKey(null)
    setDraftRow(null)
  }

  function handleDeleteClick(event: MouseEvent<HTMLButtonElement>, row: TRow, rowIndex: number) {
    event.stopPropagation()
    if (!enableDeleting) {
      return
    }
    const confirmMessage = getDeleteConfirmMessage(row, rowIndex)
    if (confirmMessage === null) {
      setRows((current) => current.filter((item, index) => getRowKey(item, index) !== getRowKey(row, rowIndex)))
      onDeleteRow?.(row, rowIndex)
      return
    }
    setPendingDeleteKey(getRowKey(row, rowIndex))
  }

  function handleConfirmDeleteClick(event: MouseEvent<HTMLButtonElement>, row: TRow, rowIndex: number) {
    event.stopPropagation()
    setPendingDeleteKey(null)
    const targetKey = getRowKey(row, rowIndex)
    setRows((current) => current.filter((item, index) => getRowKey(item, index) !== targetKey))
    onDeleteRow?.(row, rowIndex)
  }

  function handleCancelDeleteClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    setPendingDeleteKey(null)
  }

  const mrtColumns: MRT_ColumnDef<TRow>[] = columns.map((column) => ({
    id: column.key,
    header: typeof column.header === 'string' ? column.header : column.key,
    Header: () => <>{column.header}</>,
    accessorFn: column.accessor ? (row: TRow) => row[column.accessor as keyof TRow] : undefined,
    enableSorting: false,
    enableColumnFilter: false,
    enableColumnActions: false,
    enableHiding: false,
    muiTableHeadCellProps: {
      align: column.align ?? 'left',
      className: column.headerClassName,
      sx: {
        padding: '0.5rem 1rem',
        whiteSpace: 'nowrap',
        color: 'var(--text-strong)',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--surface-strong)',
        width: column.width,
      },
    },
    muiTableBodyCellProps: {
      align: column.align ?? 'left',
      className: column.cellClassName,
      sx: {
        padding: '0.4rem 1rem',
        color: 'var(--text)',
        verticalAlign: 'middle',
        borderBottom: '1px solid var(--border)',
      },
    },
    Cell: ({ row }) => {
      const originalRow = row.original
      const rowIndex = row.index
      const rowKey = getRowKey(originalRow, rowIndex)
      const isEditingRow = enableEditing && editingKey === rowKey
      const displayRow = isEditingRow && draftRow ? draftRow : originalRow
      const showEditor = isEditingRow && Boolean(column.editable || column.renderEditor)
      if (showEditor) {
        return column.renderEditor
          ? column.renderEditor(displayRow, handleDraftChange, rowIndex)
          : renderDefaultEditor(column, displayRow)
      }
      return renderCellContent(column, displayRow, rowIndex)
    },
  }))

  const table = useMaterialReactTable<TRow>({
    columns: mrtColumns,
    data: isLoading ? [] : rows,
    getRowId: (row, index) => String(getRowKey(row, index)),
    enableTopToolbar: Boolean(createRow),
    enableBottomToolbar: false,
    enablePagination: false,
    enableSorting: false,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableGlobalFilter: false,
    enableHiding: false,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    enableColumnDragging: false,
    enableColumnOrdering: false,
    enableColumnResizing: false,
    enableStickyHeader: false,
    enableToolbarInternalActions: false,
    initialState: { density: 'compact' },
    enableRowActions: hasRowActions,
    positionActionsColumn: 'last',
    displayColumnDefOptions: {
      'mrt-row-actions': {
        header: typeof actionsHeader === 'string' ? actionsHeader : 'Actions',
        Header: () => <>{actionsHeader}</>,
        size: 100,
        muiTableHeadCellProps: {
          align: 'right',
          sx: {
            padding: '0.5rem 1rem',
            color: 'var(--text-strong)',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--surface-strong)',
          },
        },
        muiTableBodyCellProps: {
          align: 'right',
          className: 'grid__actions-cell',
          sx: {
            padding: '0.25rem 1rem',
            borderBottom: '1px solid var(--border)',
          },
        },
      },
    },
    renderTopToolbarCustomActions: createRow
      ? () => (
          <Tooltip title={addRowLabel}>
            <IconButton size="small" color="primary" aria-label="Add" onClick={handleAddClick}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )
      : undefined,
    renderRowActions: hasRowActions
      ? ({ row }) => {
          const originalRow = row.original
          const rowIndex = row.index
          const rowKey = getRowKey(originalRow, rowIndex)
          const isEditingRow = enableEditing && editingKey === rowKey
          const isPendingDelete = !isEditingRow && pendingDeleteKey === rowKey
          if (isEditingRow) {
            return (
              <>
                <Tooltip title={saveRowLabel}>
                  <IconButton
                    size="small"
                    color="primary"
                    aria-label="Save"
                    onClick={(event) => handleSaveClick(event, originalRow, rowIndex)}
                  >
                    <SaveIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={cancelEditLabel}>
                  <IconButton size="small" aria-label="Cancel" onClick={handleCancelEditClick}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )
          }
          if (isPendingDelete) {
            return (
              <>
                <span className="grid__delete-confirm-message">
                  {getDeleteConfirmMessage(originalRow, rowIndex)}
                </span>
                <Tooltip title={confirmDeleteLabel}>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label="Confirm"
                    onClick={(event) => handleConfirmDeleteClick(event, originalRow, rowIndex)}
                  >
                    <CheckIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={cancelDeleteLabel}>
                  <IconButton size="small" aria-label="Cancel" onClick={handleCancelDeleteClick}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )
          }
          return (
            <>
              {enableEditing ? (
                <Tooltip title={editRowLabel}>
                  <IconButton
                    size="small"
                    aria-label="Edit"
                    onClick={(event) => handleEditClick(event, originalRow, rowIndex)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : null}
              {enableDeleting ? (
                <Tooltip title={deleteRowLabel}>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label="Delete"
                    onClick={(event) => handleDeleteClick(event, originalRow, rowIndex)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : null}
            </>
          )
        }
      : undefined,
    renderEmptyRowsFallback: () => (
      <div className="grid__state-row-content">{isLoading ? loadingMessage : emptyMessage}</div>
    ),
    muiTableHeadRowProps: {
      sx: { backgroundColor: 'var(--surface-strong)' },
    },
    muiTableBodyRowProps: ({ row }) => {
      const originalRow = row.original
      const rowIndex = row.index
      const rowKey = getRowKey(originalRow, rowIndex)
      const isEditingRow = enableEditing && editingKey === rowKey
      const rowIsClickable = isClickable && !isEditingRow
      return {
        onClick: rowIsClickable ? () => onRowClick?.(originalRow, rowIndex) : undefined,
        onKeyDown: rowIsClickable
          ? (event: KeyboardEvent<HTMLTableRowElement>) => handleRowKeyDown(event, originalRow, rowIndex)
          : undefined,
        tabIndex: rowIsClickable ? 0 : undefined,
        role: rowIsClickable ? 'button' : undefined,
        className: rowClassName?.(originalRow, rowIndex),
        sx: {
          '&:hover': { backgroundColor: 'var(--accent-soft)' },
          ...(rowIsClickable ? { cursor: 'pointer' } : {}),
          ...(rowIsClickable
            ? { '&:focus-visible': { outline: '2px solid var(--accent)', outlineOffset: '-2px' } }
            : {}),
          ...(isEditingRow
            ? { backgroundColor: 'var(--accent-soft)', boxShadow: 'inset 2px 0 0 var(--accent)' }
            : {}),
        },
      }
    },
    muiTopToolbarProps: {
      sx: {
        padding: '0.4rem 0.75rem',
        minHeight: 'auto',
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
      },
    },
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        backgroundColor: 'transparent',
        backgroundImage: 'none',
        boxShadow: 'none',
        borderRadius: 0,
      },
    },
  })

  return (
    <div className={joinClassNames('grid', className)}>
      {caption ? <div className="grid__caption">{caption}</div> : null}
      <MaterialReactTable table={table} />
    </div>
  )
}
