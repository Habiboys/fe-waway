const ORG_KEY = "wablast_org_id";

export function getCurrentOrganizationId() {
  const value = localStorage.getItem(ORG_KEY);
  return value ? Number(value) : null;
}

export function setCurrentOrganizationId(orgId) {
  if (!orgId) {
    localStorage.removeItem(ORG_KEY);
    return;
  }

  localStorage.setItem(ORG_KEY, String(orgId));
}
