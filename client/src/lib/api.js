const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const tokenExpiredEvent = new EventTarget();

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers || {});
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!headers.has("Content-Type") && options.body && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && token) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    tokenExpiredEvent.dispatchEvent(new CustomEvent("tokenExpired"));

    if (
      typeof window !== "undefined" &&
      !window.location.pathname.includes("/signin")
    ) {
      window.location.href = "/signin?expired=true";
    }
  }

  return response;
}
