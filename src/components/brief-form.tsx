import { submitBrief } from "@/app/actions";
import { MustHaveChips } from "./must-haves";
import type { Dict } from "@/lib/i18n/en";
import type { Lang } from "@/lib/i18n";

export function BriefForm({ t, lang, error }: { t: Dict; lang: Lang; error?: boolean }) {
  return (
    <form action={submitBrief} aria-label={t.brief.aria} className="formbox">
      <input type="hidden" name="lang" value={lang} />
      {error ? <p className="note-err" role="alert">{t.brief.error}</p> : null}
      <div className="cols">
        <div className="field"><label htmlFor="b-name">{t.brief.name}</label><input id="b-name" name="name" autoComplete="name" required /></div>
        <div className="field"><label htmlFor="b-email">{t.brief.email}</label><input id="b-email" name="email" type="email" autoComplete="email" /></div>
        <div className="field"><label htmlFor="b-phone">{t.brief.phone}</label><input id="b-phone" name="phone" type="tel" autoComplete="tel" /></div>
        <div className="field">
          <label htmlFor="b-timing">{t.brief.timing}</label>
          <select id="b-timing" name="timing"><option value="Within 3 months">{t.brief.timing1}</option><option value="3 to 12 months">{t.brief.timing2}</option><option value="Just looking">{t.brief.timing3}</option></select>
        </div>
        <div className="field"><label htmlFor="b-min">{t.brief.budgetFrom}</label><input id="b-min" name="min" inputMode="numeric" placeholder={t.brief.examplePrice1} /></div>
        <div className="field"><label htmlFor="b-max">{t.brief.budgetTo}</label><input id="b-max" name="max" inputMode="numeric" placeholder={t.brief.examplePrice2} /></div>
        <div className="field"><label htmlFor="b-areas">{t.brief.areas}</label><input id="b-areas" name="areas" placeholder={t.brief.areasExample} /></div>
        <div className="field">
          <label htmlFor="b-beds">{t.brief.bedsAtLeast}</label>
          <select id="b-beds" name="beds" defaultValue=""><option value="">{t.search.any}</option><option>4</option><option>5</option><option>6</option><option value="7">7+</option></select>
        </div>
      </div>
      <MustHaveChips t={t} legend={t.list.mustHaves} />
      <div className="field"><label htmlFor="b-msg">{t.brief.anythingElse}</label><textarea id="b-msg" name="message" /></div>
      <div className="inline" style={{ justifyContent: "space-between", gap: 16 }}>
        <p className="small" style={{ maxWidth: "44ch" }}>{t.brief.privacy}</p>
        <button className="btn solid" type="submit">{t.brief.send}</button>
      </div>
    </form>
  );
}
