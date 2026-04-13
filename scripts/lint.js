import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const ROOT = process.cwd()
const IGNORE_DIRS = new Set([
  '.git',
  '.omx',
  '.code-review-graph',
  'node_modules',
  'assets'
])

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.gitignore') {
      if (!entry.isDirectory()) continue
    }

    const fullPath = path.join(dir, entry.name)
    const relative = path.relative(ROOT, fullPath)

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue
      files.push(...await walk(fullPath))
      continue
    }

    if (entry.name.endsWith('.js') || entry.name === 'package.json') {
      files.push(relative)
    }
  }

  return files
}

const files = await walk(ROOT)
let hasFailures = false

for (const file of files) {
  const fullPath = path.join(ROOT, file)

  if (file.endsWith('.js')) {
    const result = spawnSync(process.execPath, ['--check', fullPath], {
      encoding: 'utf8'
    })

    if (result.status !== 0) {
      hasFailures = true
      process.stderr.write(result.stderr)
    }
  }

  if (file.endsWith('package.json')) {
    try {
      JSON.parse(await readFile(fullPath, 'utf8'))
    } catch (error) {
      hasFailures = true
      console.error(`Invalid JSON in ${file}:`, error.message)
    }
  }
}

if (hasFailures) {
  process.exitCode = 1
} else {
  console.log(`Syntax checked ${files.length} files.`)
}
