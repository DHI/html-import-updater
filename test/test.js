import test from 'ava'
import del from 'del'
import readFile from 'fs-readfile-promise'
import { parser } from '../lib'

/**
 * Setup.
 */
const filesAndMatches = {
  imports: {
    filelist: ['test-assets/examples/simple/import.html'],
    result: {
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
    result: {
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
    result: {
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

/**
 * Reader tests.
 */
// TODO

/**
 * Parser tests.
 */
test('parser should return correct import matches', async (t) => {
    t.plan(3)

    const importMatches1 = await parser({
      fileList: filesAndMatches.imports.filelist,
      search: '../',
      replace: '../lib/'
    })

    const importMatches2 = await parser({
      fileList: filesAndMatches.scripts.filelist,
      search: '../',
      replace: '../lib/'
    })

    const importMatches3 = await parser({
      fileList: filesAndMatches.links.filelist,
      search: '../',
      replace: '../lib/'
    })

    t.deepEqual(importMatches1, [filesAndMatches.imports.result])
    t.deepEqual(importMatches2, [filesAndMatches.scripts.result])
    t.deepEqual(importMatches3, [filesAndMatches.links.result])
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
