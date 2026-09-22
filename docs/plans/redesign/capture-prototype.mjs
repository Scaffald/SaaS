import { chromium } from 'playwright';

// Captures every screen of the SCF prototype at desktop and phone widths.
//
// The prototype is a single-file Claude Design build. Its home is the
// Scaffald/Prototype repo; a local copy sits (gitignored) at `redesign/` in
// this checkout. The file loads its own support script and stylesheet by
// relative path, so it renders straight from disk — no server needed:
//
//   node docs/plans/redesign/capture-prototype.mjs
//
// Override the source or the output directory:
//
//   PROTOTYPE_URL=http://localhost:8099/Scaffald%20App.dc.html \
//   node docs/plans/redesign/capture-prototype.mjs docs/plans/redesign/shots
//
// (`preview_start prototype` in .claude/launch.json serves `redesign/` on
// :8099 if you would rather look at it in a browser.)

const OUT = process.argv[2] ?? new URL('./shots/', import.meta.url).pathname;
const BASE =
  process.env.PROTOTYPE_URL ??
  new URL('../../../redesign/Scaffald%20App.dc.html', import.meta.url).href;

// [ctx, screen, extraState?]
//
// Most screens render from `{ ctx, screen }` alone. The ones added in the
// 16 Sep build (assessment flows, deal room, hire, inquiry, case detail,
// assessment detail) read a selection or a step counter from state, so they
// carry the same patch the app's own `go`/menu handlers apply — ids come from
// the seed constants near the top of the file (PIPE_SEED, NS_SEED, assessData).
const SCREENS = [
  ['worker', 'home'], ['worker', 'profile'], ['worker', 'assessments'],
  ['worker', 'jobsW'], ['worker', 'opportunities'], ['worker', 'network'],
  ['worker', 'empProfile'], ['worker', 'apply'], ['worker', 'notifications'],
  ['worker', 'assdetail', { assDetail: 'conduit' }],
  ['worker', 'taking', { aStep: 0, aPicked: null, aDone: false }],
  ['worker', 'ipip', { ipipStep: 0, ipipPicked: null, ipipDone: false }],
  ['worker', 'luscher', { luscherPicks: [], luscherPicks2: [], lusPass: 1, lusInterlude: false, luscherDone: false }],
  ['worker', 'grit', { gritStep: 0, gritPicked: null, gritDone: false }],
  ['worker', 'riasec', { riasecStep: 0, riasecAnswers: [], riasecDone: false }],
  ['worker', 'bgcheck'],
  ['worker', 'compose', { netSection: 'communities' }],
  ['worker', 'deal', { dealW: { stage: 'terms', name: 'Robert Hale', role: 'Site Electrical Lead', org: 'Hoffman Structures', score: 762, rate: '$54/hr', log: [], terms: [], docs: [], msgs: [], history: [], notes: [], checks: [], start: 'Oct 6' } }],
  ['employer', 'employers'], ['employer', 'jobsE'], ['employer', 'pipeline'],
  ['employer', 'recReview'], ['employer', 'flows'], ['employer', 'empStats'],
  ['employer', 'postjob'], ['employer', 'cand', { atsSel: '#5817' }],
  ['employer', 'inquiry', { atsSel: '#5817' }],
  ['employer', 'hire', { hireFor: '#5817', hireAck: false, hireDone: false }],
  ['employer', 'deal', { dealE: { stage: 'terms', name: 'Robert Hale', role: 'Site Electrical Lead', org: 'Hoffman Structures', score: 762, rate: '$54/hr', log: [], terms: [], docs: [], msgs: [], history: [], notes: [], checks: [], start: 'Oct 6' } }],
  ['recruiter', 'recPipeline'], ['recruiter', 'recPresent'], ['recruiter', 'recClients'], ['recruiter', 'recStats'],
  ['ns', 'nsCases'], ['ns', 'nsCase', { nsSel: 'NS-2245' }], ['ns', 'nsClients'], ['ns', 'nsRules'], ['ns', 'nsIntake'],
  ['admin', 'admHome'], ['admin', 'admScreening'], ['admin', 'admPeople'], ['admin', 'admJobs'],
];

const HOOK = `(() => {
  let fiber = null;
  for (const el of document.querySelectorAll('*')) {
    for (const k of Object.keys(el)) if (k.startsWith('__reactFiber$')) { fiber = el[k]; break; }
    if (fiber) break;
  }
  if (!fiber) return false;
  let f = fiber; while (f.return) f = f.return;
  const q = [f];
  while (q.length) {
    const n = q.shift();
    if (n.stateNode && n.stateNode.logic && n.stateNode.logic.state && 'screen' in n.stateNode.logic.state) {
      window.__APP = n.stateNode.logic; return true;
    }
    if (n.child) q.push(n.child);
    if (n.sibling) q.push(n.sibling);
  }
  return false;
})()`;

const browser = await chromium.launch();
const blank = [];

for (const [w, h, tag] of [[1440, 900, 'desktop'], [390, 844, 'mobile']]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await page.goto(tag === 'mobile' ? BASE + '#mobile' : BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const ok = await page.evaluate(HOOK);
  if (!ok) { console.error('hook failed'); process.exit(1); }
  for (const [ctx, screen, extra = {}] of SCREENS) {
    await page.evaluate(([c, s, x]) => window.__APP.setState({ ctx: c, screen: s, menuOpen: false, ...x }), [ctx, screen, extra]);
    await page.waitForTimeout(700);
    const file = `${OUT}/${tag}--${ctx}--${screen}.png`;
    await page.screenshot({ path: file, fullPage: true });
    // A screen that rendered nothing but the chrome is a recipe problem, not a
    // reference — say so rather than committing an empty shot.
    const textLen = await page.evaluate(() => document.body.innerText.length);
    if (textLen < 200) blank.push(`${tag}--${ctx}--${screen} (${textLen} chars)`);
    console.log('✓', file);
  }
  await page.close();
}
await browser.close();
if (blank.length) {
  console.error('\nSuspiciously empty captures — check the state recipe in SCREENS:');
  for (const b of blank) console.error('  ', b);
  process.exit(2);
}
