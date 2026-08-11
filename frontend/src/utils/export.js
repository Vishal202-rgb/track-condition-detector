function toCSV(readings) {
  const headers = [
    "timestamp",
    "label",
    "wetnessIndex",
    "confidence",
    "source",
    "weather",
    "reasoning",
  ];
  const rows = readings.map((r) =>
    headers
      .map((h) => {
        const val = r[h] ?? "";
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// imageUrl is excluded — it's a large base64 string and would bloat the
// export file massively without adding value to a data export.
function stripImage(readings) {
  return readings.map(({ imageUrl, ...rest }) => rest);
}

export function exportCSV(readings) {
  const csv = toCSV(stripImage(readings));
  downloadBlob(csv, `track-readings-${Date.now()}.csv`, "text/csv");
}

export function exportJSON(readings) {
  const json = JSON.stringify(stripImage(readings), null, 2);
  downloadBlob(json, `track-readings-${Date.now()}.json`, "application/json");
}