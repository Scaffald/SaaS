import { chromium } from 'playwright';


const OUT = process.argv[2] ?? new URL("./shots/", import.meta.url).pathname;
const BASE = 'http://localhost:8099/Scaffald%20App.dc.html';

const SCREENS = [
  ['worker', 'home'], ['worker', 'profile'], ['worker', 'assessments'],
  ['worker', 'jobsW'], ['worker', 'opportunities'], ['worker', 'network'],
  ['worker', 'empProfile'], ['worker', 'apply'], ['worker', 'notifications'],
  ['employer', 'employers'], ['employer', 'jobsE'], ['employer', 'pipeline'],
  ['employer', 'recReview'], ['employer', 'flows'], ['employer', 'empStats'],
  ['employer', 'postjob'], ['employer', 'cand'],
  ['recruiter', 'recPipeline'], ['recruiter', 'recPresent'], ['recruiter', 'recClients'], ['recruiter', 'recStats'],
  ['ns', 'nsCases'], ['ns', 'nsClients'], ['ns', 'nsRules'], ['ns', 'nsIntake'],
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

for (const [w, h, tag] of [[1440, 900, 'desktop'], [390, 844, 'mobile']]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await page.goto(tag === 'mobile' ? BASE + '#mobile' : BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const ok = await page.evaluate(HOOK);
  if (!ok) { console.error('hook failed'); process.exit(1); }
  for (const [ctx, screen] of SCREENS) {
    await page.evaluate(([c, s]) => window.__APP.setState({ ctx: c, screen: s }), [ctx, screen]);
    await page.waitForTimeout(700);
    const file = `${OUT}/${tag}--${ctx}--${screen}.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log('✓', file);
  }
  await page.close();
}
await browser.close();

// Usage:
//   pnpm exec node -e "..."  — or, from the repo root (playwright resolves there):
//   node docs/plans/redesign/capture-prototype.mjs
// Requires the prototype served on :8099 — `preview_start` the `prototype`
// entry in .claude/launch.json, or:
//   python3 -m http.server 8099 --directory ~/Development/SCF-Prototype
