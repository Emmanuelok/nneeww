import { JURISDICTIONS, type JurisdictionCode } from "./jurisdictions";

/**
 * Maps an org's onboarding-time province code to its default
 * JurisdictionCode. Falls back to ca_on if unrecognized.
 */
export function provinceToJurisdiction(province: string): JurisdictionCode {
  switch (province) {
    case "ON":
      return "ca_on";
    case "BC":
      return "ca_bc";
    case "FED":
      return "ca_fed";
    case "AB":
      return "ca_ab";
    case "QC":
      return "ca_qc";
    default:
      return "ca_on";
  }
}

/**
 * Active jurisdictions that recruiters can pick from in the posting wizard.
 */
export function activeJurisdictions() {
  return Object.values(JURISDICTIONS).filter((j) => j.active);
}
