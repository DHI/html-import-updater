import _ from 'lodash'
import globby from 'globby'
import readFile from 'fs-readfile-promise'
import writeFile from 'fs-writefile-promise'

const error = (componentName, errorMessage) => new Error(`💥  ${componentName} Panic! ${errorMessage}`)

/**
 * Reads bower files provided a working directory.
 *
 * @param {object} options
 * @param {string} options.workingDir
 * @param {array} options.excludePaths
 */
export function reader({ workingDir, excludePaths } = {}) {
  const name = 'Reader'
  const _formatExcludes = (globList) => {
    return globList.map((glob) => `${workingDir}/${glob}/**`)
  }

  if (!workingDir) {
    return Promise.reject(error(name, 'Please provide a workingDirectory.'))
  }

  if (excludePaths && !Array.isArray(excludePaths)) {
    // TODO: make this fool-proof
    let parseExcludeAsString

    try {
      parseExcludeAsString = JSON.parse(excludePaths.replace(/'/g, '"'))
    } catch (e) {
      return Promise.reject(error(name, 'Excludes should be an array of strings, like ["glob/to/exclude"]'))
    }

    excludePaths = parseExcludeAsString
  }

  return globby(
    [
      `${workingDir}/**/*.html`
    ],
    {
      ignore: [...excludePaths ? _formatExcludes(excludePaths) : [] ]
    }
  )
}

/**
 * Parses html files provided as a file list and returns a list containing path and matches.
 *
 * @param {array} fileList
 * @param {string} search The path to replace.
 * @param {string} replace Will replace search.
 * @param {array} excludePatterns A list of patterns that shouldn't be matched.
 */

// TODO: exclude patterns
// TODO: consider nested refs
export async function parser({ fileList, search, replace, excludePatterns } = {}) {
  const name = 'Parser'
  const _readFiles = (paths) => {
    return Promise.all(
      paths.map(async (path) => {
        return {
          content: await readFile(path, { encoding: 'utf8'}),
          path: path
        }
      })
    )
  }

  if (!fileList) {
    return Promise.reject(error(name, 'Please provide a fileList to parse.'))
  }

  if (fileList && !Array.isArray(fileList)) {
    return Promise.reject(error(name, 'Filelist should be an array.'))
  }

  const files = await _readFiles(fileList)

  try {
    const results = files
      .map((file) => {
        // 1. Get all matches
        const allRegExp = /<(link|script).*>/g
        let matches = []
        let match = allRegExp.exec(file.content)

        while (match) {
          matches.push({
            full: match[0],
            type: match[1]
          })

          match = allRegExp.exec(file.content)
        }

        // 2. Filter by search, if provided
        if (search) {
          matches = matches.filter((m) => {
            const searchRegExp = new RegExp(`(href|src)="(${search}[a-zA-Z].*)"`, 'g')
            return searchRegExp.exec(m.full)
          })
        }

        // 3. Format matches
        matches = matches.map((m) => {
          const suggestion = m.full.replace(search, replace)

          return {
            line: m.full,
            suggestion
          }
        })

        return {
          path: file.path,
          matches
        }
      })

    return results
  } catch (e) {
    console.error(e)
    throw error(name, `There was a problem parsing one or more files ${JSON.stringify(files)}`)
  }
}


/**
 * Replaces contents in a file.
 *
 * @param {object} options
 * @param {string} options.path File path to replace lines in.
 * @param {object[]} options.lines A list of lines to replace.
 * @param {string} options.lines[].line Original line (to replace).
 * @param {string} options.lines[].suggestion New line (will replace original).
 */
export async function replacer ({ path, lines }) {
  const name = 'Replacer'
  const _replaceLines = (content, lineArray) => {
    let output = `${content}`

    lineArray.forEach((l) => {
      const lineRegExp = new RegExp(l.line, 'g')
      output = output.replace(lineRegExp, l.suggestion)
    })

    return output
  }

  if (!path) {
    return Promise.reject(error(name, `File path to replace is required.`))
  }

  if (!lines || !Array.isArray(lines)) {
    console.error(`Lines failed ${JSON.stringify(lines)}`)
    return Promise.reject(error(name, `Lines to replace cannot be empty and must be a valid array`))
  }

  const file = await readFile(path, { encoding: 'utf8'})
  return _replaceLines(file, lines)
}

/**
 * Outputs content to a file.
 *
 * @param {object} options
 * @param {*} options.content The content to output.
 * @param {string} options.outputFile File path to output to.
 */
export async function outputer({ content, outputFile } = {}) {
  const name = 'Outputer'

  const _outputMessage = (result, path, message) => {
    const icon = result === 'success' ? '✅ ' : '⚠ '

    return {
      result,
      message: `${icon} ${message} to ${path}`
    }
  }

  if (!outputFile) {
    return Promise.reject(error(name, `Output file is required.`))
  }

  if (!content) {
    return _outputMessage('warning', outputFile, 'Did nothing, because there was nothing to output')
  }

  if (!isJSON(content)){
    console.error(`Content that failed: ${JSON.stringify(content)}`)
    return Promise.reject(error(name, `Invalid content provided to ${outputFile}`))
  }

  try {
    await writeFile(outputFile, JSON.stringify(content))
  } catch (e) {
    console.error(e)
    return Promise.reject(error(name, `Failed to write to ${outputFile}`))
  }

  return _outputMessage('success', outputFile, 'Outputed content')
}
