import type { ReactNode } from "react";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import concept1Image from "@/assets/concept1.png";
import { useAppContext } from "@/context";

export interface AuthPageShellProps {
  /** Small uppercase label shown above the intro panel's copy, e.g. "Welcome back". */
  readonly eyebrow: string;
  /** Rendered alongside the eyebrow, e.g. a language switcher. */
  readonly topbarExtra?: ReactNode;
  /** Supporting copy shown under the app name in the intro panel. */
  readonly subtitle: string;
  /** Short highlight bullets shown at the bottom of the intro panel. */
  readonly highlights: readonly ReactNode[];
  /** Id applied to the card's heading, referenced by the card panel's `aria-labelledby`. */
  readonly cardTitleId: string;
  /** Rendered at the bottom of the card panel, below the main content (e.g. footer links). */
  readonly footer?: ReactNode;
  readonly children: ReactNode;
}

const glassPanelSx = {
  p: { xs: 3, sm: 4 },
  borderRadius: 4,
  backgroundColor: "rgba(15, 23, 42, 0.72)",
  backdropFilter: "blur(18px)",
} as const;

export function AuthPageShell({
  eyebrow,
  topbarExtra,
  subtitle,
  highlights,
  cardTitleId,
  footer,
  children,
}: Readonly<AuthPageShellProps>) {
  const { name } = useAppContext();

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        p: { xs: 2, sm: 4 },
      }}
    >
      <Box
        sx={{
          width: "min(100%, 70rem)",
          display: "grid",
          gap: 3,
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "minmax(0, 1.1fr) minmax(20rem, 28rem)",
          },
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            ...glassPanelSx,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 4,
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ justifyContent: "space-between", alignItems: "flex-start" }}
          >
            <Typography
              variant="overline"
              sx={{ color: "primary.main", letterSpacing: "0.08em" }}
            >
              {eyebrow}
            </Typography>
            {topbarExtra}
          </Stack>

          <Stack spacing={2} sx={{ maxWidth: "32rem" }}>
            <Box
              component="img"
              src={concept1Image}
              alt="Novavex logo"
              sx={{
                width: "8rem",
                height: "8rem",
                objectFit: "contain",
                alignSelf: "center",
              }}
            />
            <Typography variant="h4" component="h1" color="text.primary">
              {name}
            </Typography>
            <Typography color="text.secondary">{subtitle}</Typography>
          </Stack>

          <Stack
            component="ul"
            spacing={1.5}
            sx={{ m: 0, p: 0, listStyle: "none" }}
          >
            {highlights.map((highlight, index) => (
              <Box
                component="li"
                // Highlights are a fixed, static list of translated strings; index is a stable key.
                key={index}
                sx={{
                  p: "1rem 1.1rem",
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  backgroundColor: "rgba(15, 23, 42, 0.56)",
                  color: "text.secondary",
                }}
              >
                {highlight}
              </Box>
            ))}
          </Stack>
        </Paper>

        <Paper
          component="section"
          aria-labelledby={cardTitleId}
          variant="outlined"
          sx={{
            ...glassPanelSx,
            display: "grid",
            gap: 3,
            alignContent: "start",
          }}
        >
          {children}
          {footer}
        </Paper>
      </Box>
    </Box>
  );
}
