import { apiRequest } from "./api.js";

export function listTransactions(params) {
  return apiRequest("/transactions", { params });
}

export function getTransactionSummary(params) {
  return apiRequest("/transactions/summary", { params });
}

export function createTransaction(type, payload) {
  const path = type === "INCOME" ? "/transactions/income" : "/transactions/expense";

  return apiRequest(path, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTransaction(id, payload) {
  return apiRequest(`/transactions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteTransaction(id) {
  return apiRequest(`/transactions/${id}`, {
    method: "DELETE",
  });
}
