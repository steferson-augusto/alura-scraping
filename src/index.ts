import puppeteer from 'puppeteer'

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
  
    await login(page)
  
    // await getFormacoes(page)
    // await getCursos(page)
    // await getAulas(page)
    
    // 15, 80, 94, 115. 123, 129, 139, 160, 182, 217, 240, 257, 265, 271, 275, 343
    await getAtividades(page, 343)

    message.success('✔ Extração concluída com sucesso')
    await browser.close()
  } catch (error) {
    message.error(error)
  }
}

run()