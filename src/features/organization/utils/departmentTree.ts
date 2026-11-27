import type { DepartmentNode } from "@/features/organization/types";

export interface FlattenedDepartment {
  readonly node: DepartmentNode;
  readonly parentId: string | null;
}

/** Depth-first flattening of a department tree, preserving display order. */
export function flattenDepartmentTree(
  tree: readonly DepartmentNode[],
  parentId: string | null = null,
): readonly FlattenedDepartment[] {
  return tree.flatMap((node) => [
    { node, parentId },
    ...flattenDepartmentTree(node.children, node.id),
  ]);
}

export function collectDepartmentIds(
  tree: readonly DepartmentNode[],
): readonly string[] {
  return flattenDepartmentTree(tree).map((entry) => entry.node.id);
}

export function findDepartmentNode(
  tree: readonly DepartmentNode[],
  departmentId: string,
): DepartmentNode | null {
  for (const node of tree) {
    if (node.id === departmentId) {
      return node;
    }

    const match = findDepartmentNode(node.children, departmentId);

    if (match) {
      return match;
    }
  }

  return null;
}

/** Ids of a node and all of its descendants (invalid move targets for that node). */
export function collectSubtreeIds(node: DepartmentNode): readonly string[] {
  return [node.id, ...node.children.flatMap(collectSubtreeIds)];
}

/** Height of a subtree: 1 for a leaf, 1 + tallest child branch otherwise. */
export function subtreeHeight(node: DepartmentNode): number {
  if (node.children.length === 0) {
    return 1;
  }

  return 1 + Math.max(...node.children.map(subtreeHeight));
}

export const maxDepartmentDepth = 6;
