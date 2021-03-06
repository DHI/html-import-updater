import test from 'ava'
import del from 'del'
import readFile from 'fs-readfile-promise'
import { reader, parser, replacer, outputer } from '../lib'

/**
 * Setup.
 */
const workingDir = 'test-assets/examples'

const nonTestAssetPaths = [
  `${workingDir}/simple/import.html`,
  `${workingDir}/simple/link.html`,
  `${workingDir}/simple/script.html`,
]

const allAssetPaths = [
  ...nonTestAssetPaths,
  `${workingDir}/test-address/test-address.html`,
  `${workingDir}/test-map/index.html`,
  `${workingDir}/test-map/test-map.html`,
  `${workingDir}/test-nested/index.html`,
  `${workingDir}/test-nested/nest/index.html`
]

const filesAndMatches = {
  imports: {
    filelist: [`${workingDir}/simple/import.html`],
    expect: {
      path: `${workingDir}/simple/import.html`,
      matches: [
        {
          line: `<link rel="import" href="../iron-component-page/iron-component-page.html">`,
          suggestion: `<link rel="import" href="../lib/iron-component-page/iron-component-page.html">`
        }
      ]
    }
  },
  scripts: {
    filelist: [`${workingDir}/simple/script.html`],
    expect: {
      path: `${workingDir}/simple/script.html`,
      matches: [
        {
          line: `<script src="../test-address.js"></script>`,
          suggestion: `<script src="../lib/test-address.js"></script>`
        }
      ]
    }
  },
  links: {
    filelist: [`${workingDir}/simple/link.html`],
    expect: {
      path: `${workingDir}/simple/link.html`,
      matches: [
        {
          line: `<link href="../test-address.css" rel="stylesheet" />`,
          suggestion: `<link href="../lib/test-address.css" rel="stylesheet" />`
        }
      ]
    }
  },
  nested: {
    filelist: [`${workingDir}/test-nested/index.html`, `${workingDir}/test-nested/nest/index.html`],
    expect: [
      {
        path: `${workingDir}/test-nested/index.html`,
        matches: [
          {
            line: `<script src="../webcomponentsjs/webcomponents-lite.js"></script>`,
            suggestion: `<script src="../lib/webcomponentsjs/webcomponents-lite.js"></script>`
          },
          {
            line: `<link rel="import" href="../iron-component-page/iron-component-page.html">`,
            suggestion: `<link rel="import" href="../lib/iron-component-page/iron-component-page.html">`
          }
        ]
      },
      {
        path: `${workingDir}/test-nested/nest/index.html`,
        matches: [
          {
            line: `<script src="../../webcomponentsjs/webcomponents-lite.js"></script>`,
            suggestion: `<script src="../../lib/webcomponentsjs/webcomponents-lite.js"></script>`
          },
          {
            line: `<link rel="import" href="../../iron-component-page/iron-component-page.html">`,
            suggestion: `<link rel="import" href="../../lib/iron-component-page/iron-component-page.html">`
          }
        ]
      },
    ]
  },
  exclude: {
    filelist: [`${workingDir}/test-nested/index.html`, `${workingDir}/test-nested/nest/index.html`],
    expect: [
      {
        path: `${workingDir}/test-nested/index.html`,
        matches: [
          {
            line: `<script src="../webcomponentsjs/webcomponents-lite.js"></script>`,
            suggestion: `<script src="../lib/webcomponentsjs/webcomponents-lite.js"></script>`
          }
        ]
      },
      {
        path: `${workingDir}/test-nested/nest/index.html`,
        matches: [
          {
            line: `<script src="../../webcomponentsjs/webcomponents-lite.js"></script>`,
            suggestion: `<script src="../../lib/webcomponentsjs/webcomponents-lite.js"></script>`
          }
        ]
      },
    ],
  },
  multiExclude: {
    filelist: [`${workingDir}/test-nested/index.html`, `${workingDir}/test-nested/nest/index.html`],
    expect: [
      {
        path: `${workingDir}/test-nested/index.html`,
        matches: []
      },
      {
        path: `${workingDir}/test-nested/nest/index.html`,
        matches: []
      },
    ],
  }
}

const pathsAndLines = {
  imports: {
    path: filesAndMatches.imports.expect.path,
    lines: filesAndMatches.imports.expect.matches,
  },
  scripts: {
    path: filesAndMatches.scripts.expect.path,
    lines: filesAndMatches.scripts.expect.matches,
  },
  links: {
    path: filesAndMatches.links.expect.path,
    lines: filesAndMatches.links.expect.matches,
  }
}

/**
 * Clean output files before each test.
 */
test.beforeEach('clean up output', async () => {
    await del(['replaced'])
})

 /**
  *  Reader tests.
  */
 test('reader should fail if no workingDir provided', async (t) => {
     t.plan(2)

     const paths = await t.throws(reader())
     t.is(paths.message, '💥  Reader Panic! Please provide a workingDirectory.')
 })

 test('reader should succeed if workingDir provided', async (t) => {
     t.plan(1)

     const paths = await reader({ workingDir: workingDir })
     t.truthy(paths)
 })

 test('reader should return an array of paths for workingDir', async (t) => {
     t.plan(1)

     const paths = await reader({ workingDir: workingDir })
     t.deepEqual(paths, allAssetPaths)
 })

 test('reader should fail if exclude glob not an array', async (t) => {
     t.plan(2)

     const paths = await t.throws(reader({ workingDir: workingDir, excludePaths: 'test-*' }))
     t.is(paths.message, '💥  Reader Panic! Excludes should be an array of strings, like ["glob/to/exclude"]')
 })

 test('reader should return a filtered array for workingDir if exclude glob provided', async (t) => {
     t.plan(1)

     const paths = await reader({ workingDir: workingDir, excludePaths: ['test-*'] })
     t.deepEqual(paths, nonTestAssetPaths)
 })

 test('reader should parse exclude glob array strings', async (t) => {
     t.plan(2)

     const paths = await reader({ workingDir: workingDir, excludePaths: "['test-*']" })
     const paths1 = await reader({ workingDir: workingDir, excludePaths: '["test-*"]' }) // Different quotes

     t.deepEqual(paths, nonTestAssetPaths)
     t.deepEqual(paths1, nonTestAssetPaths)
 })

 test('reader should filter by multiple exclude globs', async (t) => {
     t.plan(1)

     const paths = await reader({ workingDir: workingDir, excludePaths: ['test-*', 'sim*'] })
     t.deepEqual(paths, [])
 })

/**
 * Parser tests.
 */
// TODO: better test coverage.
test('parser should return correct import matches', async (t) => {
    t.plan(3)

    const matches1 = await parser({
      fileList: filesAndMatches.imports.filelist,
      search: '../',
      replace: '../lib/'
    })

    const matches2 = await parser({
      fileList: filesAndMatches.scripts.filelist,
      search: '../',
      replace: '../lib/'
    })

    const matches3 = await parser({
      fileList: filesAndMatches.links.filelist,
      search: '../',
      replace: '../lib/'
    })

    t.deepEqual(matches1, [filesAndMatches.imports.expect])
    t.deepEqual(matches2, [filesAndMatches.scripts.expect])
    t.deepEqual(matches3, [filesAndMatches.links.expect])
})

test('parser should handle nested refs correctly', async (t) => {
  t.plan(1)

  const matches = await parser({
    fileList: filesAndMatches.nested.filelist,
    search: '../',
    replace: '../lib/'
  })

  t.deepEqual(matches, filesAndMatches.nested.expect)
})

test('parser should exclude if paths provided', async (t) => {
  t.plan(1)

  const matches = await parser({
    fileList: filesAndMatches.exclude.filelist,
    search: '../',
    replace: '../lib/',
    excludePatterns: ['iron-.*']
  })

  t.deepEqual(matches, filesAndMatches.exclude.expect)
})

test('parser should exclude multiple paths', async (t) => {
  t.plan(1)

  const matches = await parser({
    fileList: filesAndMatches.multiExclude.filelist,
    search: '../',
    replace: '../lib/',
    excludePatterns: ['iron-.*', 'web']
  })

  t.deepEqual(matches, filesAndMatches.multiExclude.expect)
})

/**
 * Replacer tests.
 */
// TODO: more tests!
test('replacer should replace lines in a path', async (t) => {
  t.plan(3)

  const replaced1 = await replacer({
    path: pathsAndLines.imports.path,
    lines: pathsAndLines.imports.lines
  })

  const replaced2 = await replacer({
    path: pathsAndLines.scripts.path,
    lines: pathsAndLines.scripts.lines
  })

  const replaced3 = await replacer({
    path: pathsAndLines.links.path,
    lines: pathsAndLines.links.lines
  })

  const expectedImportsFile = await readFile('test-assets/expects/simple/import.html', { encoding: 'utf-8' })
  const expectedScriptsFile = await readFile('test-assets/expects/simple/script.html', { encoding: 'utf-8' })
  const expectedLinksFile = await readFile('test-assets/expects/simple/link.html', { encoding: 'utf-8' })

  t.deepEqual(replaced1, expectedImportsFile)
  t.deepEqual(replaced2, expectedScriptsFile)
  t.deepEqual(replaced3, expectedLinksFile)
})


/**
 * Outputer tests.
 */
test('outputer should fail with no output file', async (t) => {
  t.plan(2)

  const output = await t.throws(outputer({ content: ''}))

  t.deepEqual(output.message, '💥  Outputer Panic! Output file is required.')
})

test('outputer should do nothing without content', async (t) => {
  t.plan(1)

  const output = await outputer({ outputFile: 'replaced/file.txt' })
  t.deepEqual(output, {
      result: 'warning', message: '⚠  Did nothing, because there was nothing to output to replaced/file.txt' })
})

test('outputer should write content to an output file', async (t) => {
  t.plan(2)

  const output = await outputer({ content: 'hi there', outputFile: 'replaced/file.txt' })

  const expectedFile = await readFile('replaced/file.txt', { encoding: 'utf-8' })

  t.is(output.message, '✅  Outputed content to replaced/file.txt')
  t.deepEqual('hi there', expectedFile)
})
