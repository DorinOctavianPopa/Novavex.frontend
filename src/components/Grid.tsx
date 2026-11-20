import { useState } from 'react'
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'

import './Grid.css'

export type GridColumnAlign = 'left' | 'center' | 'right'

export interface GridColumn<TRow> {
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
   * the Grid has no `onSaveRow` handler.
   */
  readonly editable?: boolean
  /**
   * Custom editor rendered for this column while its row is being edited, instead of the default text input.
   * Call `onChange` with a partial row patch to update the row's in-progress edit draft.
   */
  readonly renderEditor?: (row: TRow, onChange: (patch: Partial<TRow>) => void, rowIndex: number) => ReactNode
}

export interface GridProps<TRow> {
  /** Description of every column to render, in display order. */
  readonly columns: ReadonlyArray<GridColumn<TRow>>
  /** Rows of data to render, one per table row. */
  readonly data: ReadonlyArray<TRow>
  /** Derives a stable React key for a given row. */
  readonly getRowKey: (row: TRow, rowIndex: number) => string | number
  readonly caption?: ReactNode
  /** Shown instead of rows when `data` is empty. Defaults to a generic message. */
  readonly emptyMessage?: ReactNode
  /** Shown instead of rows while data is being fetched. */
  readonly isLoading?: boolean
  readonly loadingMessage?: ReactNode
  readonly className?: string
  /** Called when a row is activated via click, Enter or Space. Rows become focusable when provided. */
  readonly onRowClick?: (row: TRow, rowIndex: number) => void
  /** Derives an additional class name for a given row. */
  readonly rowClassName?: (row: TRow, rowIndex: number) => string | undefined
  /** Called when the toolbar "Add" action is activated. The toolbar is only rendered when provided. */
  readonly onAddRow?: () => void
  /** Label for the add-row toolbar button. Defaults to `'Add'`. */
  readonly addRowLabel?: ReactNode
  /**
   * Called when a row's inline edit is saved, with the edited draft row, the original row, and the row index.
   * An actions column with an "Edit" button is added automatically when provided. Editing a row switches its
   * editable columns into inputs directly in place (see `GridColumn.editable`/`renderEditor`), rather than
   * opening a separate form.
   */
  readonly onSaveRow?: (updatedRow: TRow, originalRow: TRow, rowIndex: number) => void
  /** Label for the edit action button that enters inline edit mode. Defaults to `'Edit'`. */
  readonly editRowLabel?: ReactNode
  /** Label for the button that saves an in-progress inline edit. Defaults to `'Save'`. */
  readonly saveRowLabel?: ReactNode
  /** Label for the button that discards an in-progress inline edit. Defaults to `'Cancel'`. */
  readonly cancelEditLabel?: ReactNode
  /**
   * Called when a row's "Delete" action is confirmed. An actions column is added automatically when provided.
   * Unless `getDeleteConfirmMessage` resolves to `null`, deleting a row first shows an inline "Confirm"/"Cancel"
   * step in place of the row's actions rather than a blocking native dialog.
   */
  readonly onDeleteRow?: (row: TRow, rowIndex: number) => void
  /** Label for the delete action button. Defaults to `'Delete'`. */
  readonly deleteRowLabel?: ReactNode
  /** Label for the inline delete-confirmation button. Defaults to `'Confirm'`. */
  readonly confirmDeleteLabel?: ReactNode
  /** Label for the inline delete-cancellation button. Defaults to `'Cancel'`. */
  readonly cancelDeleteLabel?: ReactNode
  /** Header label for the actions column shown when `onSaveRow` and/or `onDeleteRow` are provided. */
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

export function Grid<TRow>({
  columns,
  data,
  getRowKey,
  caption,
  emptyMessage = 'No data to display.',
  isLoading = false,
  loadingMessage = 'Loading…',
  className,
  onRowClick,
  rowClassName,
  onAddRow,
  addRowLabel = 'Add',
  onSaveRow,
  editRowLabel = 'Edit',
  saveRowLabel = 'Save',
  cancelEditLabel = 'Cancel',
  onDeleteRow,
  deleteRowLabel = 'Delete',
  confirmDeleteLabel = 'Confirm',
  cancelDeleteLabel = 'Cancel',
  actionsHeader = 'Actions',
  getDeleteConfirmMessage = () => 'Are you sure you want to delete this row?',
}: GridProps<TRow>) {
  const [pendingDeleteKey, setPendingDeleteKey] = useState<string | number | null>(null)
  const [editingKey, setEditingKey] = useState<string | number | null>(null)
  const [draftRow, setDraftRow] = useState<TRow | null>(null)
  const isClickable = typeof onRowClick === 'function'
  const hasInlineEditing = typeof onSaveRow === 'function'
  const hasRowActions = hasInlineEditing || typeof onDeleteRow === 'function'
  const columnCount = columns.length + (hasRowActions ? 1 : 0)

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
      onSaveRow?.(draftRow, row, rowIndex)
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
    if (!onDeleteRow) {
      return
    }
    const confirmMessage = getDeleteConfirmMessage(row, rowIndex)
    if (confirmMessage === null) {
      onDeleteRow(row, rowIndex)
      return
    }
    setPendingDeleteKey(getRowKey(row, rowIndex))
  }

  function handleConfirmDeleteClick(event: MouseEvent<HTMLButtonElement>, row: TRow, rowIndex: number) {
    event.stopPropagation()
    setPendingDeleteKey(null)
    onDeleteRow?.(row, rowIndex)
  }

  function handleCancelDeleteClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    setPendingDeleteKey(null)
  }

  return (
    <div className={joinClassNames('grid', className)}>
      {onAddRow ? (
        <div className="grid__toolbar">
          <button type="button" className="grid__add-button" onClick={onAddRow}>
            {addRowLabel}
          </button>
        </div>
      ) : null}
      <table className="grid__table">
        {caption ? <caption className="grid__caption">{caption}</caption> : null}
        <thead>
          <tr className="grid__header-row">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={joinClassNames('grid__header-cell', column.headerClassName)}
                style={{ width: column.width, textAlign: column.align ?? 'left' }}
              >
                {column.header}
              </th>
            ))}
            {hasRowActions ? (
              <th
                scope="col"
                className="grid__header-cell grid__header-cell--actions"
                style={{ textAlign: 'right' }}
              >
                {actionsHeader}
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr className="grid__state-row">
              <td colSpan={columnCount}>{loadingMessage}</td>
            </tr>
          ) : data.length === 0 ? (
            <tr className="grid__state-row">
              <td colSpan={columnCount}>{emptyMessage}</td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const rowKey = getRowKey(row, rowIndex)
              const isEditingRow = hasInlineEditing && editingKey === rowKey
              const isPendingDelete = !isEditingRow && hasRowActions && pendingDeleteKey === rowKey
              const displayRow = isEditingRow && draftRow ? draftRow : row
              const rowIsClickable = isClickable && !isEditingRow
              return (
                <tr
                  key={rowKey}
                  className={joinClassNames(
                    'grid__row',
                    rowIsClickable && 'grid__row--clickable',
                    isEditingRow && 'grid__row--editing',
                    rowClassName?.(row, rowIndex),
                  )}
                  onClick={rowIsClickable ? () => onRowClick(row, rowIndex) : undefined}
                  onKeyDown={rowIsClickable ? (event) => handleRowKeyDown(event, row, rowIndex) : undefined}
                  tabIndex={rowIsClickable ? 0 : undefined}
                  role={rowIsClickable ? 'button' : undefined}
                >
                  {columns.map((column) => {
                    const showEditor = isEditingRow && (column.editable || column.renderEditor)
                    return (
                      <td
                        key={column.key}
                        className={joinClassNames('grid__cell', column.cellClassName)}
                        style={{ textAlign: column.align ?? 'left' }}
                      >
                        {showEditor
                          ? column.renderEditor
                            ? column.renderEditor(displayRow, handleDraftChange, rowIndex)
                            : renderDefaultEditor(column, displayRow)
                          : renderCellContent(column, displayRow, rowIndex)}
                      </td>
                    )
                  })}
                  {hasRowActions ? (
                    <td className="grid__cell grid__actions-cell">
                      {isEditingRow ? (
                        <>
                          <button
                            type="button"
                            className="grid__action-button grid__action-button--primary"
                            onClick={(event) => handleSaveClick(event, row, rowIndex)}
                          >
                            {saveRowLabel}
                          </button>
                          <button
                            type="button"
                            className="grid__action-button"
                            onClick={handleCancelEditClick}
                          >
                            {cancelEditLabel}
                          </button>
                        </>
                      ) : isPendingDelete ? (
                        <>
                          <span className="grid__delete-confirm-message">
                            {getDeleteConfirmMessage(row, rowIndex)}
                          </span>
                          <button
                            type="button"
                            className="grid__action-button grid__action-button--danger"
                            onClick={(event) => handleConfirmDeleteClick(event, row, rowIndex)}
                          >
                            {confirmDeleteLabel}
                          </button>
                          <button
                            type="button"
                            className="grid__action-button"
                            onClick={handleCancelDeleteClick}
                          >
                            {cancelDeleteLabel}
                          </button>
                        </>
                      ) : (
                        <>
                          {hasInlineEditing ? (
                            <button
                              type="button"
                              className="grid__action-button"
                              onClick={(event) => handleEditClick(event, row, rowIndex)}
                            >
                              {editRowLabel}
                            </button>
                          ) : null}
                          {onDeleteRow ? (
                            <button
                              type="button"
                              className="grid__action-button grid__action-button--danger"
                              onClick={(event) => handleDeleteClick(event, row, rowIndex)}
                            >
                              {deleteRowLabel}
                            </button>
                          ) : null}
                        </>
                      )}
                    </td>
                  ) : null}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
