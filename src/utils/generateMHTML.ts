import fs from 'fs'
import { Page } from 'puppeteer'
import retry from 'async-retry'
import ora, { Ora } from 'ora'

import createFolder from './createFolder'
import message from './message'

export default async function generateMHTML(
  page: Page,
  path: string,
  name: string = 'index',
  loader: Ora | undefined = undefined
) {
  const spinner: Ora = loader ?? ora('Verificando pastas...').start()
  try {
    await retry(async (_bail, attempt) => {
      spinner.start('Verificando pastas...')
      try {
        const textAttempt = attempt > 1 ? ` (tentativa ${attempt}/3)` : ''
        createFolder(path)
        spinner.text = 'Extraindo HTML...' + textAttempt
        const cdp = await page.target().createCDPSession()
        await cdp.send('Page.enable')
        const { data } = await cdp.send('Page.captureSnapshot', { format: 'mhtml' })
      
        spinner.text = 'Salvando HTML...' + textAttempt
        fs.writeFileSync(`${path}/${name}.mhtml`, data)
        spinner.succeed('HTML salvo com sucesso')
      } catch (error) {
        throw new Error('Falha ao gerar MHTML')
      }
    }, { retries: 3 })
  } catch (error) {
    spinner.fail('Falha ao gerar HTML')
    message.warn(error)
    throw new Error('Falha ao gerar HTML')    
  }
}