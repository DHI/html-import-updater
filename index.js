import inquirer from 'inquirer'
import { reader, parser, replacer, outputer } from './lib'

// TODO: pass params below through CLI
async function runtime () {
  const fileList = await reader({
     workingDir: 'test-assets/examples' // hardcoded
  })

  const parseResults = await parser({
    fileList,
    search: '../', // hardcoded
    replace: '../lib/' // hardcoded
  })

  const allQuestions = parseResults.reduce((acc, cur) => {
    const resultQuestion = cur.matches.map((r, i) => {
      return {
        type: 'confirm',
        name: cur.path.replace('.html', `:${i}`),
        message: `
Confirm change in ${cur.path}:

- ${r.line}
+ ${r.suggestion} \n \n`,
        default: true
      }
    })

    return [...acc, ...resultQuestion]
  }, [])

  const parseAnswers = (answers) => {
    console.log(answers)
    console.log(`✅  aaaaaand done. Updated all the things!`)

    // const suggestions = await replacer({
    //   path,
    //   lines: matches
    // })
  }

  return inquirer
    .prompt(allQuestions)
    .then(parseAnswers)
}

runtime()

// {
//   type: 'confirm',
//     name: 'test-address/test-address:1',
//       message: `
// Confirm change in test-address/test-address.html:

// - href="../polymer/polymer.html"
// + href="../lib/polymer/polymer.html" \n \n`,
//     default: true
// }

// const parseAnswers = (answers) => {
//   console.log(answers)
//   console.log(`✅  aaaaaand done. Updated all the things!`)
// }
//
// inquirer
//   .prompt(questions)
//   .then(parseAnswers)
