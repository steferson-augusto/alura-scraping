import puppeteer from 'puppeteer'
import commandLineArgs from 'command-line-args'

import message from './utils/message'
import login from './services/login'
import getAtividades from './services/getAtividades'
// import getAulas from './services/getAulas'
// import getCursos from './services/getCursos'
// import getFormacoes from './services/getFormacoes'

const run = async () => {
  try {
    const browser = await puppeteer.launch({ headless: true })
    let page = await browser.newPage()
    await page.setDefaultNavigationTimeout(0)

    const { start } = commandLineArgs([{ name: 'start', alias: 's', type: Number, defaultValue: 0 }])

    await login(page)

    // await getFormacoes(page)
    // await getCursos(page)
    // await getAulas(page)

    // 360 403 469 603
    await getAtividades(page, start)

    message.success('✔ Extração concluída com sucesso')
    await browser.close()
  } catch (error) {
    message.error(error)
  }
}

run()