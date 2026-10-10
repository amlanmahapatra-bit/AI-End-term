import { db } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const card = { background: "#fff", border: "1px solid #e7e5e4", borderRadius: 8, padding: "12px 16px" } as const;
const th = { textAlign: "left", padding: "6px 8px", color: "#78716c", fontWeight: 500, borderBottom: "1px solid #e7e5e4" } as const;
const td = { padding: "6px 8px", borderBottom: "1px solid #f5f5f4", verticalAlign: "top" } as const;

export default async function Dashboard() {
  const sb = db();
  const [{ data: days, error: dayErr }, { data: calls }] = await Promise.all([
    sb.from("daily_metrics").select("*").order("day", { ascending: false }).limit(30),
    sb.from("calls").select("*").order("started_at", { ascending: false }).limit(25),
  ]);

  if (dayErr) {
    return (
      <main style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px" }}>
        <h1>Database error</h1>
        <p>The dashboard could not read from Supabase: {dayErr.message}</p>
      </main>
    );
  }

  const sum = (k: string) => (days ?? []).reduce((a, d: any) => a + Number(d[k] ?? 0), 0);
  const total = { calls: sum("calls"), after: sum("after_hours_calls"), qualified: sum("qualified"), booked: sum("booked"), showed: sum("showed_up"), won: sum("won"), value: sum("won_value_inr"), cost: sum("cost_inr") };
  const tiles: [string, string][] = [
    ["Calls answered", String(total.calls)],
    ["After-hours calls", String(total.after)],
    ["Qualified", String(total.qualified)],
    ["Consultations booked", String(total.booked)],
    ["Showed up", String(total.showed)],
    ["Projects won", `${total.won} (${inr(total.value)})`],
    ["Total running cost", inr(total.cost)],
    ["Cost per qualified lead", total.qualified ? inr(total.cost / total.qualified) : "n/a"],
    ["Cost per booking", total.booked ? inr(total.cost / total.booked) : "n/a"],
  ];

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ margin: "0 0 4px" }}>Aangan Studio · Call agent</h1>
      <p style={{ color: "#78716c", margin: "0 0 20px" }}>Last 30 days. Cost = voice minutes + AI classification.</p>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
        {tiles.map(([label, value]) => (
          <div key={label} style={card}>
            <div style={{ color: "#78716c", fontSize: 12 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{value}</div>
          </div>
        ))}
      </section>

      <h2 style={{ marginTop: 28 }}>By day</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 14 }}>
          <thead><tr>{["Day", "Calls", "After hours", "Qualified", "Booked", "Showed", "Won", "Cost"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {(days ?? []).map((d: any) => (
              <tr key={d.day}>
                <td style={td}>{d.day}</td><td style={td}>{d.calls}</td><td style={td}>{d.after_hours_calls}</td><td style={td}>{d.qualified}</td>
                <td style={td}>{d.booked}</td><td style={td}>{d.showed_up}</td><td style={td}>{d.won}</td><td style={td}>{inr(Number(d.cost_inr ?? 0))}</td>
              </tr>
            ))}
            {!days?.length && <tr><td style={td} colSpan={8}>No calls yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: 28 }}>Recent calls</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 14 }}>
          <thead><tr>{["Started", "Caller", "Result", "Why", "Slot", "After hrs", "Cost"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {(calls ?? []).map((c: any) => (
              <tr key={c.id}>
                <td style={td}>{c.started_at ? new Date(c.started_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : ""}</td>
                <td style={td}>{c.caller_number ?? ""}</td>
                <td style={td}>{c.classification ?? c.status}</td>
                <td style={td}>{c.fit_reason ?? ""}</td>
                <td style={td}>{c.booked_slot ? new Date(c.booked_slot).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : ""}</td>
                <td style={td}>{c.after_hours ? "Yes" : "No"}</td>
                <td style={td}>{inr(Number(c.cost_voice_inr ?? 0) + Number(c.cost_llm_inr ?? 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
