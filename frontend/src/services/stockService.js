import { apiRequest } from "./api.js";

export function listStockItems(params) {
  return apiRequest("/stock", { params });
}

export function getStockSummary(params) {
  return apiRequest("/stock/summary", { params });
}

export function getLowStockItems(params) {
  return apiRequest("/stock/low-stock", { params });
}

export function createStockItem(payload) {
  return apiRequest("/stock", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateStockItem(id, payload) {
  return apiRequest(`/stock/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteStockItem(id) {
  return apiRequest(`/stock/${id}`, {
    method: "DELETE",
  });
}
