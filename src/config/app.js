export const APP_NAME =
  import.meta.env.APP_NAME ||
  import.meta.env.APP_Name ||
  import.meta.env.VITE_APP_NAME ||
  "WA Blast SaaS";

export const API_BASE_URL =
  import.meta.env.API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000/api";
