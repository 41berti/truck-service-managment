export const monthNames = [
  "Janar",
  "Shkurt",
  "Mars",
  "Prill",
  "Maj",
  "Qershor",
  "Korrik",
  "Gusht",
  "Shtator",
  "Tetor",
  "Nëntor",
  "Dhjetor",
];

export function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB").format(date);
}

export function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function getCurrentPeriod() {
  const now = new Date();

  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

export function getMonthRange(month, year) {
  const normalizedMonth = Number(month);
  const normalizedYear = Number(year);
  const from = `${normalizedYear}-${String(normalizedMonth).padStart(2, "0")}-01`;
  const to = new Date(normalizedYear, normalizedMonth, 0)
    .toISOString()
    .slice(0, 10);

  return { from, to };
}

export function getPeriodLabel(month, year) {
  return `${monthNames[Number(month) - 1]} ${year}`;
}

export function buildYearOptions(span = 4) {
  const currentYear = new Date().getFullYear();

  return Array.from({ length: span + 1 }, (_, index) => currentYear - index);
}
