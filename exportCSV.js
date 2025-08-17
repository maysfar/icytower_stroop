export function exportCSV(trialData, filename = "stroop_results.csv") {

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
  a.download = "stroop_results.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}
