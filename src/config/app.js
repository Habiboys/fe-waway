export const APP_NAME =
  import.meta.env.APP_NAME ||
  import.meta.env.APP_Name ||
  import.meta.env.VITE_APP_NAME ||
  "WA Blast SaaS";

const envApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.API_BASE_URL ||
  "";

const defaultApiBaseUrl = import.meta.env.PROD
  ? `${window.location.origin}/api`
  : "http://localhost:3000/api";

export const API_BASE_URL = envApiBaseUrl || defaultApiBaseUrl;
