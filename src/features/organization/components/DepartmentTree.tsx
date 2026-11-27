import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import BlockIcon from "@mui/icons-material/Block";
import DriveFileMoveIcon from "@mui/icons-material/DriveFileMove";
import EditIcon from "@mui/icons-material/Edit";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import { useTranslation } from "react-i18next";

import type { DepartmentNode } from "@/features/organization/types";
import {
  collectDepartmentIds,
  maxDepartmentDepth,
} from "@/features/organization/utils/departmentTree";

export interface DepartmentTreeProps {
  readonly tree: readonly DepartmentNode[];
  /** Shows the per-node management actions when true (organizationWritePolicy). */
  readonly canManage: boolean;
  readonly onAddChild: (parentId: string | null) => void;
  readonly onRename: (node: DepartmentNode) => void;
  readonly onMove: (node: DepartmentNode) => void;
  readonly onDeactivate: (node: DepartmentNode) => void;
}

/** Multilevel department tree with inline add/rename/move/deactivate actions. */
export function DepartmentTree({
  tree,
  canManage,
  onAddChild,
  onRename,
  onMove,
  onDeactivate,
}: DepartmentTreeProps) {
  const { t } = useTranslation();
  // Fully expanded on mount; the page remounts this component whenever a fresh
  // tree is fetched, so no synchronization effect is needed.
  const [expandedItems, setExpandedItems] = useState<string[]>(() => [
    ...collectDepartmentIds(tree),
  ]);

  function stop(event: React.MouseEvent) {
    event.stopPropagation();
  }

  function renderLabel(node: DepartmentNode) {
    const canAddChild = node.depth < maxDepartmentDepth;
    const canDeactivate = node.memberCount === 0 && node.children.length === 0;

    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minHeight: 36 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {node.name}
        </Typography>
        <Chip
          size="small"
          variant="outlined"
          label={t("organizationPage.tree.memberCount", {
            count: node.memberCount,
          })}
        />
        {canManage ? (
          <Box sx={{ display: "flex", gap: 0.25, ml: "auto" }}>
            <Tooltip title={t("organizationPage.tree.addChild")}>
              <span>
                <IconButton
                  size="small"
                  disabled={!canAddChild}
                  aria-label={t("organizationPage.tree.addChild")}
                  onClick={(event) => {
                    stop(event);
                    onAddChild(node.id);
                  }}
                >
                  <AddIcon fontSize="inherit" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={t("organizationPage.tree.rename")}>
              <IconButton
                size="small"
                aria-label={t("organizationPage.tree.rename")}
                onClick={(event) => {
                  stop(event);
                  onRename(node);
                }}
              >
                <EditIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("organizationPage.tree.move")}>
              <IconButton
                size="small"
                aria-label={t("organizationPage.tree.move")}
                onClick={(event) => {
                  stop(event);
                  onMove(node);
                }}
              >
                <DriveFileMoveIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={
                canDeactivate
                  ? t("organizationPage.tree.deactivate")
                  : t("organizationPage.tree.deactivateBlocked")
              }
            >
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={!canDeactivate}
                  aria-label={t("organizationPage.tree.deactivate")}
                  onClick={(event) => {
                    stop(event);
                    onDeactivate(node);
                  }}
                >
                  <BlockIcon fontSize="inherit" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        ) : null}
      </Box>
    );
  }

  function renderNode(node: DepartmentNode) {
    return (
      <TreeItem key={node.id} itemId={node.id} label={renderLabel(node)}>
        {node.children.map(renderNode)}
      </TreeItem>
    );
  }

  return (
    <Box>
      {canManage ? (
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => {
            onAddChild(null);
          }}
          sx={{ mb: 1 }}
        >
          {t("organizationPage.tree.addRoot")}
        </Button>
      ) : null}

      {tree.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t("organizationPage.tree.empty")}
        </Typography>
      ) : (
        <SimpleTreeView
          aria-label={t("organizationPage.tree.ariaLabel")}
          expandedItems={expandedItems}
          onExpandedItemsChange={(_event, itemIds) => {
            setExpandedItems(itemIds);
          }}
          disableSelection
        >
          {tree.map(renderNode)}
        </SimpleTreeView>
      )}
    </Box>
  );
}
