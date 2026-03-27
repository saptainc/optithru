/**
 * OptiThru design tokens
 * Brand palette — no traffic-light colors for data viz
 * Red/Yellow/Green reserved exclusively for buffer & constraint status
 */
export const purple = {
  50: "#EEEDFE",
  100: "#CECBF6",
  200: "#AFA9EC",
  400: "#7F77DD",
  600: "#534AB7",
  700: "#534AB7",
  800: "#3C3489",
  900: "#26215C",
} as const

export const colors = {
  brand: purple[700],
  brandDark: purple[800],
  brandDeep: purple[900],
  brandLight: purple[200],
  brandSurface: purple[50],
  constraintBg: "#FAECE7",
  constraintText: "#993C1D",
  // T/CU tiers — brand palette, NOT traffic-light colors
  tcuTop: "#3b63d9",     // blue — top tier
  tcuMid: "#7c6cc4",     // violet — mid tier
  tcuLow: "#9b8ab0",     // muted purple — lower tier
} as const

export const type = {
  pageTitle: "18px",
  sectionHeading: "16px",
  cardTitle: "14px",
  body: "13px",
  micro: "11px",
  weight: { normal: 400, medium: 500 },
} as const

export const layout = {
  topbarHeight: "56px",
  sidebarWidth: "200px",
  aiPanelWidth: "360px",
} as const

/** Brand-palette T/CU color — NOT traffic-light */
export function tcuColor(tcu: number): string {
  if (tcu >= 2) return colors.tcuTop
  if (tcu >= 1) return colors.tcuMid
  return colors.tcuLow
}
