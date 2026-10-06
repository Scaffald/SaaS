// Assemble the publish folder for the Scaffald Design System artifact.
//
// Regenerates tokens.json from packages/ui, then copies the system's files plus
// the fonts (apps/scaffald/public/fonts) and raster logos (apps/scaffald/assets)
// into tmp-design-system/ at the repo root, which is gitignored. Publish that
// folder with the Artifact tool as README.md here describes.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..', '..')
const OUT = path.join(ROOT, 'tmp-design-system')

execFileSync(process.execPath, [path.join(HERE, 'gen-tokens.mjs')], { stdio: 'inherit' })

fs.rmSync(OUT, { recursive: true, force: true })
fs.cpSync(path.join(HERE, 'project'), path.join(OUT, 'project'), { recursive: true })

const fonts = ['Roboto-Regular', 'Roboto-Medium', 'Roboto-Bold', 'RobotoSerif-Regular', 'CormorantGaramond-Variable']
fs.mkdirSync(path.join(OUT, 'project/fonts'), { recursive: true })
for (const f of fonts) fs.copyFileSync(path.join(ROOT, 'apps/scaffald/public/fonts', f + '.woff2'), path.join(OUT, 'project/fonts', f + '.woff2'))
fs.copyFileSync(path.join(ROOT, 'apps/scaffald/assets/logo-full.png'), path.join(OUT, 'project/assets/Logos/scaffald-wordmark.png'))
fs.copyFileSync(path.join(ROOT, 'apps/scaffald/assets/icon.png'), path.join(OUT, 'project/assets/Logos/scaffald-app-icon.png'))

// The files map for the Artifact publish: every text file except the index
// (sent as file_path, last) and the binaries under assets/ (uploads named by the index).
const walk = (d, acc = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p, acc) : acc.push(p) } return acc }
const rel = walk(path.join(OUT, 'project')).map(p => path.relative(OUT, p)).filter(p => p !== 'project/design-system.json' && !/^project\/assets\/.*\.(svg|png)$/.test(p)).sort()
const map = Object.fromEntries(rel.map(p => [p, p.endsWith('.d.ts') ? { from: p, contentType: 'text/plain' } : p]))
fs.writeFileSync(path.join(OUT, 'files-map.json'), JSON.stringify(map, null, 2))
console.log(`${rel.length} files staged in ${path.relative(ROOT, OUT)}/ — files map in files-map.json`)
