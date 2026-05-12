export function statusLabel(result) {
  if (result.empty) return "Waiting";
  if (result.error) return "Invalid JSON";
  return "Valid JSON";
}

export function statusClass(result) {
  if (result.empty) return "bg-slate-100 text-slate-600 ring-slate-200";
  if (result.error) return "bg-rose-50 text-rose-700 ring-rose-200";
  return "bg-emerald-50 text-emerald-700 ring-emerald-200";
}

export function diffTone(type) {
  if (type === "added") return "border-emerald-300 bg-emerald-50";
  if (type === "removed") return "border-amber-300 bg-amber-50";
  if (type === "type") return "border-fuchsia-300 bg-fuchsia-50";
  return "border-sky-300 bg-sky-50";
}

export function diffBadgeClass(type) {
  if (type === "added") return "bg-emerald-50 text-emerald-700";
  if (type === "removed") return "bg-amber-50 text-amber-700";
  if (type === "type") return "bg-fuchsia-50 text-fuchsia-700";
  return "bg-sky-50 text-sky-700";
}

export function diffLabel(type) {
  if (type === "type") return "value type";
  return type;
}

export function selectedCompareSummary(options) {
  const selectedCount = Object.values(options).filter(Boolean).length;

  if (selectedCount === 3) return "All checks";
  if (selectedCount === 0) return "No checks";
  return `${selectedCount} check${selectedCount === 1 ? "" : "s"}`;
}
