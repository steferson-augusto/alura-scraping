import puppeteer from 'puppeteer'
require('dotenv').config()

import getAtividades from './services/getAtividades'
import message from './utils/message'
// import getAulas from './services/getAulas'
// import getCursos from './services/getCursos'
// import getFormacoes from './services/getFormacoes'


const run = async () => {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.setDefaultNavigationTimeout(0)

  await page.goto('https://cursos.alura.com.br/loginForm')

  await page.type('[name="username"]', process.env.EMAIL as string)
  await page.type('[name="password"]', process.env.PASSWORD as string)

  await page.click('.btn-login')

  await page.waitForNavigation()

  // await getFormacoes(page)
  // await getCursos(page)
  // await getAulas(page)
  
  await getAtividades(page)
  message.success('✔ Extração concluída com sucesso')
  await browser.close()
}

run()