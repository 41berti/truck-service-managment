import { apiRequest } from "./api.js";

export function listAppointments(params) {
  return apiRequest("/appointments", { params });
}

export function createAppointment(payload) {
  return apiRequest("/appointments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAppointmentStatus(id, status) {
  return apiRequest(`/appointments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
