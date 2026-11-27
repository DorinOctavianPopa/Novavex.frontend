import { useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Skeleton from "@mui/material/Skeleton";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

import { useOrganizationMembers } from "@/features/organization/hooks/useOrganizationMembers";
import type { DepartmentNode } from "@/features/organization/types";
import { flattenDepartmentTree } from "@/features/organization/utils/departmentTree";

const allDepartmentsValue = "__all__";
const rosterPageSize = 10;

export interface OrgMemberRosterProps {
  readonly organizationId: string;
  readonly tree: readonly DepartmentNode[];
}

/** Read-only, paged member roster with an optional department (+ descendants) filter. */
export function OrgMemberRoster({ organizationId, tree }: OrgMemberRosterProps) {
  const { t } = useTranslation();
  const [departmentFilter, setDepartmentFilter] = useState(allDepartmentsValue);
  const [includeDescendants, setIncludeDescendants] = useState(true);
  const [page, setPage] = useState(1);

  const flattened = useMemo(() => flattenDepartmentTree(tree), [tree]);

  const { data, isLoading, error } = useOrganizationMembers(organizationId, {
    departmentId:
      departmentFilter === allDepartmentsValue ? undefined : departmentFilter,
    includeDescendants:
      departmentFilter === allDepartmentsValue ? undefined : includeDescendants,
    page,
    pageSize: rosterPageSize,
  });

  const pageCount = data ? Math.ceil(data.totalCount / data.pageSize) : 0;

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", mb: 1 }}>
        <TextField
          select
          size="small"
          sx={{ minWidth: 220 }}
          label={t("organizationPage.members.filterLabel")}
          value={departmentFilter}
          onChange={(event) => {
            setDepartmentFilter(event.target.value);
            setPage(1);
          }}
        >
          <MenuItem value={allDepartmentsValue}>
            {t("organizationPage.members.allDepartments")}
          </MenuItem>
          {flattened.map((entry) => (
            <MenuItem
              key={entry.node.id}
              value={entry.node.id}
              sx={{ pl: 2 + (entry.node.depth - 1) * 2 }}
            >
              {entry.node.name}
            </MenuItem>
          ))}
        </TextField>
        {departmentFilter !== allDepartmentsValue ? (
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={includeDescendants}
                onChange={(event) => {
                  setIncludeDescendants(event.target.checked);
                  setPage(1);
                }}
              />
            }
            label={t("organizationPage.members.includeDescendants")}
          />
        ) : null}
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {isLoading ? (
        <Box aria-busy="true">
          <Skeleton height={44} />
          <Skeleton height={44} />
          <Skeleton height={44} />
        </Box>
      ) : null}

      {!isLoading && !error && data && data.items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t("organizationPage.members.empty")}
        </Typography>
      ) : null}

      {!isLoading && data && data.items.length > 0 ? (
        <List dense disablePadding>
          {data.items.map((member) => (
            <ListItem key={member.id} disableGutters divider>
              <ListItemText primary={member.fullName} secondary={member.email} />
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                {member.departmentNames.map((departmentName) => (
                  <Chip
                    key={departmentName}
                    size="small"
                    variant="outlined"
                    label={departmentName}
                  />
                ))}
              </Box>
            </ListItem>
          ))}
        </List>
      ) : null}

      {pageCount > 1 ? (
        <Pagination
          size="small"
          sx={{ mt: 1 }}
          count={pageCount}
          page={page}
          onChange={(_event, nextPage) => {
            setPage(nextPage);
          }}
        />
      ) : null}
    </Box>
  );
}
