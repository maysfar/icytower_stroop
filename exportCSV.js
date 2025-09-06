/*export function exportCSV(trialData, filename = "stroop_results.csv") {

    const cols = [
    "session","trial","condition","word","ink_color",
    "labels_order","correct_label","response_label",
    "rt_ms","accuracy","final_grade","outcome","timestamp"
    ];
    const esc = (v) => {
    if (v == null) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  };

  const rows = [cols.join(",")].concat(
    trialData.map(r => cols.map(c => esc(r[c])).join(","))
  );

  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}*/
 const CLOUD_URL = "https://script.google.com/macros/s/AKfycbwEFccgLNO9e4jrtophSytVN38NHfvmyRE4Hz4EMLtxFpDADJSNQ4HfdxgWhGw72sOKzA/exec"; // <-- fill later
 export async function exportCSV(trialData, filename = "stroop_results.csv") {

   const cols = [
     "session","trial","condition","word","ink_color",
     "labels_order","correct_label","response_label",
     "rt_ms","accuracy","final_grade","outcome","timestamp"
   ];
   const esc = (v) => {
     if (v == null) return "";
     const s = String(v);
     return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
   };

  const rows = [cols.join(",")].concat(
    trialData.map(r => cols.map(c => esc(r[c])).join(","))
  );
  const csvText = rows.join("\r\n");

  // 1) Try cloud upload (returns early on success)
  try {
    const res = await fetch(CLOUD_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoids CORS preflight
      body: JSON.stringify({ filename, csv: csvText })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) return; // uploaded OK -> skip local download
  } catch { /* ignore and fall back */ }

  // 2) Fallback: save to the computer (original code)
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
   const url = URL.createObjectURL(blob);

   const a = document.createElement("a");
   a.href = url;
   a.download = filename;
   document.body.appendChild(a);
   a.click();
   document.body.removeChild(a);

   URL.revokeObjectURL(url);
 }

