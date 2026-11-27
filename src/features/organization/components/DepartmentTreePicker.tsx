import { useState } from "react";
import Typography from "@mui/material/Typography";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import { useTranslation } from "react-i18next";

import type { DepartmentNode } from "@/features/organization/types";
import { collectDepartmentIds } from "@/features/organization/utils/departmentTree";

export interface DepartmentTreePickerProps {
  readonly tree: readonly DepartmentNode[];
  readonly selectedIds: readonly string[];
  readonly onChange: (departmentIds: readonly string[]) => void;
  readonly disabled?: boolean;
}

/** Checkbox multi-select over an organization's department tree. */
export function DepartmentTreePicker({
  tree,
  selectedIds,
  onChange,
  disabled = false,
}: DepartmentTreePickerProps) {
  const { t } = useTranslation();
  // Fully expanded on mount; consumers mount this component only once the tree
  // has loaded, so no synchronization effect is needed.
  const [expandedItems, setExpandedItems] = useState<string[]>(() => [
    ...collectDepartmentIds(tree),
  ]);

  if (tree.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t("organizationPage.tree.empty")}
      </Typography>
    );
  }

  function renderNode(node: DepartmentNode) {
    return (
      <TreeItem
        key={node.id}
        itemId={node.id}
        label={node.name}
        disabled={disabled}
      >
        {node.children.map(renderNode)}
      </TreeItem>
    );
  }

  return (
    <SimpleTreeView
      aria-label={t("organizationPage.tree.pickerAriaLabel")}
      multiSelect
      checkboxSelection
      selectedItems={[...selectedIds]}
      onSelectedItemsChange={(_event, itemIds) => {
        onChange(itemIds);
      }}
      expandedItems={expandedItems}
      onExpandedItemsChange={(_event, itemIds) => {
        setExpandedItems(itemIds);
      }}
    >
      {tree.map(renderNode)}
    </SimpleTreeView>
  );
}
