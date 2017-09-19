import inquirer from 'inquirer'
import program from 'commander'
import colors from 'colors'
import path from 'path'
import { reader, parser, replacer, outputer } from './lib'

let excludePaths = []
let excludePatterns = []
const collectExcludePaths = (value) => excludePaths = [...excludePaths, value]
const collectExcludePatterns = (value) => excludePatterns = [...excludePatterns, value]

program
  .version('1.0.0')
  .option('--cwd, --workingDir <workingDir>', 'Current working directory (where your files are).')
  .option('--e, --excludePaths [excludePaths]', 'One or many paths (or globs) you want to exclude, i.e. `-e "prefix-*"`. Can be applied multiple times: `-e "one" -e "two"`.', collectExcludePaths)
  .option('--o, --outputDir <outputDir>', 'The output directory.')
  .option('--s, --search <search>', 'The string you want to search for, i.e. "../"')
  .option('--r, --replace <replace>', 'The string you want to replace each occurrence of the search string with.')
  .option('--ep, --excludePatterns <excludePatterns>', 'One or many regular expressions that you want to exclude from each matched search item, i.e. `-ep "iron.*"`. Can be applied multiple times: `-ep "one" -ep "two"`.', collectExcludePatterns)
  .parse(process.argv)

async function runtime () {
  const { workingDir, excludePaths, outputDir, search, replace, excludePatterns} = program

  const fileList = await reader({ workingDir, excludePaths })

  const parseResults = await parser({
    workingDir,
    fileList,
    search,
    replace,
    excludePatterns
  })

  const allQuestions = parseResults.reduce((acc, cur) => {
    const resultQuestion = cur.matches.map((r, i) => {
      return {
        type: 'confirm',
        name: cur.path.replace('.html', `:${i}`), // NB: Dot ('.') will nest the result, avoid it in path.
        message: `
Confirm change in ${cur.path}:

${colors.red(`- ${r.line}`)}
${colors.green(`+ ${r.suggestion}`)} \n \n`,
        default: true
      }
    })

    return [...acc, ...resultQuestion]
  }, [])

  const parseAnswers = (answers) => {
    const mapAnswerIndexes = (flag) => {
      // This method makes it possible to handle true / false values of answers[cur] (flag), without writing the same logic twice.
      return (acc, cur) => {
        const path = cur.substring(0, cur.lastIndexOf(':')) + '.html'
        const index = parseInt(cur.substring(cur.lastIndexOf(':') + 1))
        const valid = flag ? answers[cur] : !answers[cur]

        if (valid) {
          if (!acc[path]) {
            acc[path] = [index]
          } else {
            acc[path] = [...acc[path], index]
          }
        }

        return acc
      }
    }

   /**
    * Workflow
    * 1. Categorize answers.
    * 2. Map categorized answers with their matches.
    * 3. Make replaced content & output to file.
    */
    const denied = Object
      .keys(answers)
      .reduce(mapAnswerIndexes(false), {})

    const accepted = Object
      .keys(answers)
      .reduce(mapAnswerIndexes(true), {})

    const mapPathToAnswers = (subject) => {
      return (item) => {
        const matchList = subject[item]
        const matches = parseResults
          .find((m) => m.path === item)
          .matches
          .filter((m, i) => matchList.indexOf(i) !== -1)

        return {
          path: item,
          matches
        }
      }
    }

    const deniedWithMatches = Object
      .keys(denied)
      .map(mapPathToAnswers(denied))

    const acceptedWithMatches = Object
      .keys(accepted)
      .map(mapPathToAnswers(accepted))

    return Promise
      .all(
        acceptedWithMatches
          .map(async (item) => {
            const fullPath = outputDir ? path.join(outputDir, item.path) : item.path
            const content = await replacer({
              path: item.path,
              lines: item.matches
            })

            return outputer({ content, outputFile: fullPath})
          })
      )
      .then(() => {
        if (deniedWithMatches.length) {
          console.log(`
⚠️  Some lines were skipped, you might want to check them:
--------------------------------------------------------
          `)
          deniedWithMatches.forEach((item) => {
            console.log(`
File: ${colors.green(item.path)}
Lines:
            `)

            item.matches.map((m) => console.log(`- ${colors.yellow(m.line)}`))
          })
        }


        const totalReplaced = acceptedWithMatches.reduce((acc, cur) => {
            acc += cur.matches.length
            return acc
        }, 0)

        console.log(`
----------------------------------------
✅  aaaaaand done.

Replaced ${colors.blue(totalReplaced)} occurrences of ${colors.red(search)} with ${colors.green(replace)}.`)
      })
      .catch((e) => console.error(`💥 Failed misserably. \n`, e))
  }

  return inquirer
    .prompt(allQuestions)
    .then(parseAnswers)
}

try {
    runtime()
} catch (e) {
    console.error(e)
    console.error('Importer failed misserably ☹. ')
}
