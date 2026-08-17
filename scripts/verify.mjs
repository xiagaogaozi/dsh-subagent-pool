import { readFileSync } from 'node:fs'

const files = ['src/index.ts', 'lib/index.js']
const validName = /^[a-z][a-z0-9_]*$/
let failures = 0

for (const file of files) {
  const source = readFileSync(file, 'utf8')
  const names = [...source.matchAll(/systemPrompt\.variable\(\s*['"]([^'"]+)['"]/g)].map((match) => match[1])
  if (names.length === 0) {
    console.error(`${file}: no systemPrompt.variable() declaration found`)
    failures++
  }
  for (const name of names) {
    if (!validName.test(name)) {
      console.error(`${file}: invalid system-prompt variable name ${JSON.stringify(name)}`)
      failures++
    }
    if (!source.includes(`{{${name}}}`)) {
      console.error(`${file}: missing matching {{${name}}} placeholder`)
      failures++
    }
  }
}

const clientSource = readFileSync('src/client/SubagentPoolPage.tsx', 'utf8')
if (!/\buseEffect\b/.test(clientSource)) {
  console.error('src/client/SubagentPoolPage.tsx: missing useEffect import for initial profile loading')
  failures++
}
if (!/useEffect\(\(\) => \{\s*void load\(\)\s*\}, \[\]\)/s.test(clientSource)) {
  console.error('src/client/SubagentPoolPage.tsx: missing initial load() effect')
  failures++
}

if (failures > 0) process.exit(1)
console.log('plugin contracts: PASS')
