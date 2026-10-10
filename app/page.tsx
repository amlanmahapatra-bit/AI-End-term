import { db } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const ist = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "";

const LABEL: Record<string, string> = { qualified: "Qualified", not_fit: "Not a fit", complaint: "Complaint", unclear: "Unclear" };

function Badge({ value }: { value?: string | null }) {
  const v = value ?? "unclear";
  return <span className={`badge b-${v}`}>{LABEL[v] ?? v}</span>;
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

export default async function Dashboard() {
  const sb = db();
  const [{ data: days, error: dayErr }, { data: calls }, { data: sept }] = await Promise.all([
    sb.from("daily_metrics").select("*").order("day", { ascending: false }).limit(30),
    sb.from("calls").select("*").order("started_at", { ascending: false }).limit(10),
    // September baseline lives in its own table so it never mixes with live totals or cost.
    sb.from("imported_enquiries").select("*").order("received_at", { ascending: true }),
  ]);

  if (dayErr) {
    return (
      <main className="wrap">
        <h2>Database error</h2>
        <p className="lead">The dashboard could not read from Supabase: {dayErr.message}</p>
      </main>
    );
  }

  const sum = (k: string) => (days ?? []).reduce((a, d: any) => a + Number(d[k] ?? 0), 0);
  const t = { calls: sum("calls"), after: sum("after_hours_calls"), qualified: sum("qualified"), booked: sum("booked"), showed: sum("showed_up"), won: sum("won"), cost: sum("cost_inr") };
  const top = Math.max(t.calls, 1);

  const funnel: [string, number][] = [
    ["Calls answered", t.calls],
    ["Qualified", t.qualified],
    ["Consultation booked", t.booked],
    ["Showed up", t.showed],
    ["Project won", t.won],
  ];

  const s = {
    total: sept?.length ?? 0,
    after: sept?.filter((r: any) => r.after_hours).length ?? 0,
    qualified: sept?.filter((r: any) => r.classification === "qualified").length ?? 0,
    notFit: sept?.filter((r: any) => r.classification === "not_fit").length ?? 0,
    complaint: sept?.filter((r: any) => r.classification === "complaint").length ?? 0,
    unclear: sept?.filter((r: any) => r.classification === "unclear").length ?? 0,
    pricing: sept?.filter((r: any) => r.asked_pricing).length ?? 0,
  };

  return (
    <>
      <header className="top">
        <div className="top-in">
          <div className="brand">
            <span className="logo" />
            <span>Aangan Studio <small>· Call agent</small></span>
          </div>
          <span className="live"><span className="dot" /> Agent live · answers 24/7</span>
        </div>
      </header>

      <main className="wrap">
        <section className="hero">
          <h1>Every call answered. Every lead qualified.</h1>
          <p>An AI front desk that picks up in seconds, asks the right questions, books the consultation and hands the designer the full brief. Results and running cost, in one place.</p>
          <div className="chips">
            <span className="chip">Answers day and night</span>
            <span className="chip">Qualifies against Nikhil&apos;s rubric</span>
            <span className="chip">Books and sends the invite</span>
            <span className="chip cut">Never quotes a price</span>
          </div>
        </section>

        <section className="grid kpis">
          <Kpi label="Calls answered" value={String(t.calls)} sub="Last 30 days" />
          <Kpi label="After-hours calls" value={String(t.after)} sub="Outside 10am to 7pm" />
          <Kpi label="Qualified leads" value={String(t.qualified)} sub={t.calls ? `${Math.round((t.qualified / t.calls) * 100)}% of calls` : "No calls yet"} />
          <Kpi label="Consultations booked" value={String(t.booked)} sub={t.qualified ? `${Math.round((t.booked / t.qualified) * 100)}% of qualified` : ""} />
        </section>

        <section className="grid kpis" style={{ marginTop: 14 }}>
          <Kpi label="Running cost" value={inr(t.cost)} sub="Voice minutes + AI" />
          <Kpi label="Cost per qualified lead" value={t.qualified ? inr(t.cost / t.qualified) : "n/a"} />
          <Kpi label="Cost per booking" value={t.booked ? inr(t.cost / t.booked) : "n/a"} />
          <Kpi label="Projects won" value={String(t.won)} sub={t.won ? "Tracked from bookings" : ""} />
        </section>

        <h2>From call to project</h2>
        <p className="lead">How far each call gets.</p>
        <div className="card funnel">
          {funnel.map(([name, n]) => (
            <div className="frow" key={name}>
              <span>{name}</span>
              <div className="track"><div className="bar" style={{ width: `${(n / top) * 100}%` }} /></div>
              <span className="n">{n}</span>
            </div>
          ))}
        </div>

        <h2>Recent calls</h2>
        <p className="lead">Latest 10 calls, newest first.</p>
        <div className="card tablecard">
          {calls?.length ? (
            <div className="scroll">
              <table>
                <thead><tr><th>Time (IST)</th><th>Caller</th><th>Result</th><th>Reason</th><th>Slot</th><th>Cost</th></tr></thead>
                <tbody>
                  {calls.map((c: any) => (
                    <tr key={c.id}>
                      <td className="num">{ist(c.started_at)}{c.after_hours ? " · after hours" : ""}</td>
                      <td className="num">{c.caller_number ?? ""}</td>
                      <td><Badge value={c.classification} /></td>
                      <td className="why">{c.fit_reason ?? ""}</td>
                      <td className="num">{ist(c.booked_slot)}</td>
                      <td className="num">{inr(Number(c.cost_voice_inr ?? 0) + Number(c.cost_llm_inr ?? 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">No live calls yet. Make a test call and it appears here within a minute.</div>
          )}
        </div>

        <h2>September, before the agent</h2>
        <p className="lead">Real phone enquiries from September 2026, classified by the same AI. Kept separate from the live numbers above.</p>
        {!sept?.length ? (
          <div className="card empty">Baseline data not loaded yet.</div>
        ) : (
          <>
            <div className="split">
              <div className="card">
                <div className="label">What came in</div>
                <ul className="list">
                  <li><span>Phone enquiries analysed</span><b>{s.total}</b></li>
                  <li><span>Arrived outside 10am to 7pm</span><b>{s.after}</b></li>
                  <li><span>Asked about price</span><b>{s.pricing}</b></li>
                </ul>
              </div>
              <div className="card">
                <div className="label">What they were</div>
                <ul className="list">
                  <li><span>Worth a designer&apos;s time</span><b>{s.qualified}</b></li>
                  <li><span>Not a fit</span><b>{s.notFit}</b></li>
                  <li><span>Complaints, missed or unclear</span><b>{s.complaint + s.unclear}</b></li>
                </ul>
              </div>
            </div>
            <div className="card tablecard" style={{ marginTop: 14 }}>
              <div className="scroll">
                <table>
                  <thead><tr><th>ID</th><th>Received (IST)</th><th>Result</th><th>Deciding reason</th></tr></thead>
                  <tbody>
                    {sept.map((r: any) => (
                      <tr key={r.id}>
                        <td className="num">{r.id}</td>
                        <td className="num">{ist(r.received_at)}{r.after_hours ? " · after hours" : ""}</td>
                        <td><Badge value={r.classification} /></td>
                        <td className="why">{r.fit_reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <footer className="foot">
          <span>Voice: Vaani AI</span>
          <span>Classification: Gemini</span>
          <span>Handoff: email + calendar invite</span>
          <span>The agent never quotes a price. Pricing stays with the designer.</span>
        </footer>
      </main>
    </>
  );
}
