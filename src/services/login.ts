import ora from 'ora'
import { Page } from 'puppeteer'
require('dotenv').config()

export default async function login(page: Page, prefix: string = '') {
  const spinner = ora('Realizando login...')
  spinner.prefixText = prefix
  spinner.start()
  try {
    await page.goto('https://cursos.alura.com.br/loginForm')
    
    await page.type('[name="username"]', process.env.EMAIL as string)
    await page.type('[name="password"]', process.env.PASSWORD as string)
  
    await page.click('.btn-login')
  
    // await page.waitForSelector('.profile-info-name')
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' })
    
    spinner.succeed('Login realizado com sucesso')
  } catch (error) {
    spinner.fail('Falha ao fazer login')
  }
}