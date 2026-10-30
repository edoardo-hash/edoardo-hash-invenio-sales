import { fmt } from "@/lib/i18n";
import type { Dict } from "@/lib/i18n/en";
import { MUST_HAVE_GROUPS, MUST_HAVES, POPULAR_MUST_HAVES } from "@/lib/rules";

/** Must-have chips: the popular ones first, then every feature under its group (closed unless something in it is ticked). */
export function MustHaveChips({ t, selected = [], legend }: { t: Dict; selected?: string[]; legend: string }) {
  const label = (k: string) => t.mustHave[k] ?? k;
  const chip = (k: string) => (
    <label key={k} className="chip"><input type="checkbox" name={`m_${k}`} defaultChecked={selected.includes(k)} /> {label(k)}</label>
  );
  const rest = MUST_HAVE_GROUPS.map((g) => ({ g, keys: MUST_HAVES.filter((m) => m.group === g && !POPULAR_MUST_HAVES.includes(m.key)).map((m) => m.key) })).filter((x) => x.keys.length);
  return (
    <div className="stack" style={{ gap: 12 }}>
      <fieldset className="chips">
        <legend className="lab" style={{ marginBottom: 10 }}>{legend}</legend>
        {POPULAR_MUST_HAVES.map(chip)}
      </fieldset>
      <details className="more-features" open={rest.some((x) => x.keys.some((k) => selected.includes(k)))}>
        <summary>{t.featureGroups.more}</summary>
        <div className="stack" style={{ gap: 16, paddingTop: 14 }}>
          {rest.map(({ g, keys }) => {
            const n = keys.filter((k) => selected.includes(k)).length;
            return (
              <fieldset key={g} className="chips">
                <legend className="lab" style={{ marginBottom: 8 }}>
                  {t.featureGroups[g] ?? g}{n ? ` · ${fmt(t.featureGroups.selected, { n })}` : ""}
                </legend>
                {keys.map(chip)}
              </fieldset>
            );
          })}
        </div>
      </details>
    </div>
  );
}
