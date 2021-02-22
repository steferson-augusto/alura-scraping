import fs from 'fs'
import { Page } from "puppeteer"

import createFolder from "./createFolder"
import message from './message'

export default async function generateMHTML(page: Page, path: string, name: string = 'index') {
  try {
    createFolder(path)

    const cdp = await page.target().createCDPSession()
    await cdp.send('Page.enable')
    const { data } = await cdp.send('Page.captureSnapshot', { format: 'mhtml' })
  
    fs.writeFileSync(`${path}/${name}.mhtml`, data)
  } catch (error) {
    message.error('Falha ao gerar MHTML')
  }
}