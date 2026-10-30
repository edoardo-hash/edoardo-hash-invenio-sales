import { submitBrief } from "@/app/actions";
import { MUST_HAVES } from "@/lib/rules";

export function BriefForm({ error }: { error?: boolean }) {
  return (
    <form action={submitBrief} aria-label="Buyer brief" className="formbox">
      {error ? <p className="note-err" role="alert">Please add your name and an email or phone number.</p> : null}
      <div className="cols">
        <div className="field"><label htmlFor="b-name">Full name</label><input id="b-name" name="name" autoComplete="name" required /></div>
        <div className="field"><label htmlFor="b-email">Email</label><input id="b-email" name="email" type="email" autoComplete="email" /></div>
        <div className="field"><label htmlFor="b-phone">Phone</label><input id="b-phone" name="phone" type="tel" autoComplete="tel" /></div>
        <div className="field">
          <label htmlFor="b-timing">Timing</label>
          <select id="b-timing" name="timing"><option>Within 3 months</option><option>3 to 12 months</option><option>Just looking</option></select>
        </div>
        <div className="field"><label htmlFor="b-min">Budget from (€)</label><input id="b-min" name="min" inputMode="numeric" placeholder="e.g. 3,000,000" /></div>
        <div className="field"><label htmlFor="b-max">Budget up to (€)</label><input id="b-max" name="max" inputMode="numeric" placeholder="e.g. 5,000,000" /></div>
        <div className="field"><label htmlFor="b-areas">Areas</label><input id="b-areas" name="areas" placeholder="e.g. Cala Conta, San José" /></div>
        <div className="field">
          <label htmlFor="b-beds">Bedrooms, at least</label>
          <select id="b-beds" name="beds" defaultValue=""><option value="">Any</option><option>4</option><option>5</option><option>6</option><option value="7">7+</option></select>
        </div>
      </div>
      <fieldset className="chips">
        <legend className="lab" style={{ marginBottom: 10 }}>Must-haves</legend>
        {MUST_HAVES.map((m) => (
          <label key={m.key} className="chip"><input type="checkbox" name={`m_${m.key}`} /> {m.label}</label>
        ))}
      </fieldset>
      <div className="field"><label htmlFor="b-msg">Anything else</label><textarea id="b-msg" name="message" /></div>
      <div className="inline" style={{ justifyContent: "space-between", gap: 16 }}>
        <p className="small" style={{ maxWidth: "44ch" }}>We use your details only to find you a home.</p>
        <button className="btn solid" type="submit">Send my brief</button>
      </div>
    </form>
  );
}
