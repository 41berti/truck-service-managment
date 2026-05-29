import { apiRequest, clearStoredToken, setStoredToken } from "./api.js";

const USER_KEY = "truck_service_user";

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  localStorage.removeItem(USER_KEY);
}

export async function login(email, password) {
  const result = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    token: null,
  });

  setStoredToken(result.token);
  setStoredUser(result.user);

  return result;
}

export async function getCurrentUser() {
  const result = await apiRequest("/auth/me");
  setStoredUser(result.user);
  return result.user;
}

export function logout() {
  clearStoredToken();
  clearStoredUser();
}
