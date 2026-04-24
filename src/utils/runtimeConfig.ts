const DEFAULT_BACKEND_PORT = "5000";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const buildDefaultApiBaseUrl = () => {
  if (typeof window === "undefined") {
    return `http://localhost:${DEFAULT_BACKEND_PORT}/api`;
  }
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:${DEFAULT_BACKEND_PORT}/api`;
};

const buildDefaultSocketUrl = () => {
  if (typeof window === "undefined") {
    return `http://localhost:${DEFAULT_BACKEND_PORT}`;
  }
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:${DEFAULT_BACKEND_PORT}`;
};

export const API_URL = trimTrailingSlash(
  import.meta.env.VITE_API_URL || buildDefaultApiBaseUrl(),
);

export const SOCKET_URL = trimTrailingSlash(
  import.meta.env.VITE_SOCKET_URL || buildDefaultSocketUrl(),
);
