import test from 'ava'
import del from 'del'
import readFile from 'fs-readfile-promise'
import { parser, replacer } from '../lib'

/**
 * Setup.
 */
const filesAndMatches = {
  imports: {
    filelist: ['test-assets/examples/simple/import.html'],
    expect: {
      path: 'test-assets/examples/simple/import.html',
      matches: [
        {
          line: `<link rel="import" href="../iron-component-page/iron-component-page.html">`,
          suggestion: `<link rel="import" href="../lib/iron-component-page/iron-component-page.html">`
        }
      ]
    }
  },
  scripts: {
    filelist: ['test-assets/examples/simple/script.html'],
    expect: {
      path: 'test-assets/examples/simple/script.html',
      matches: [
        {
          line: `<script src="../test-address.js"></script>`,
          suggestion: `<script src="../lib/test-address.js"></script>`
        }
      ]
    }
  },
  links: {
    filelist: ['test-assets/examples/simple/link.html'],
    expect: {
      path: 'test-assets/examples/simple/link.html',
      matches: [
        {
          line: `<link href="../test-address.css" rel="stylesheet" />`,
          suggestion: `<link href="../lib/test-address.css" rel="stylesheet" />`
        }
      ]
    }
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
 * TODO clear /replaced dir before each
 */

/**
 * Reader tests.
 */
// TODO

/**
 * Parser tests.
 */
 // TODO: more tests!
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
// TODO (use expects in test-assets)


// ...other tests
// look for *.html
// should work for js|html|css
// href & src
// allow module prefix
// some paths can be nested; should handle relative paths
// only ../ (and lower) should work; scan cwd and if files exist don't touch
// exlude ../../js ; ../../css
