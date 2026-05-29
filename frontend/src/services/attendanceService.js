import { apiRequest } from "./api.js";

export function listAttendance(params) {
  return apiRequest("/attendance", { params });
}

export function listAttendanceUsers() {
  return apiRequest("/attendance/users");
}

export function createAttendanceRecord(payload) {
  return apiRequest("/attendance", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function saveAttendanceCheckOut(id, payload) {
  return apiRequest(`/attendance/${id}/check-out`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function updateAttendanceRecord(id, payload) {
  return apiRequest(`/attendance/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteAttendanceRecord(id) {
  return apiRequest(`/attendance/${id}`, {
    method: "DELETE",
  });
}
