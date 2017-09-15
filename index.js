import inquirer from 'inquirer'
import { reader } from './lib'

const questions = [
  {
    type: 'confirm',
    name: 'test-address/test-address:1',
    message: `
Confirm change in test-address/test-address.html:

- href="../polymer/polymer.html"
+ href="../lib/polymer/polymer.html" \n \n`,
    default: false
  }
]

async function demo () {
  const result = await reader( { workingDir: 'test-assets/examples' })
  console.log(result)
}

demo()

// const parseAnswers = (answers) => {
//   console.log(answers)
//   console.log(`✅  aaaaaand done. Updated all the things!`)
// }
//
// inquirer
//   .prompt(questions)
//   .then(parseAnswers)
