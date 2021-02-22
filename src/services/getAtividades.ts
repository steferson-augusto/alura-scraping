import { HTTPResponse, Page } from "puppeteer"
const converter = require('node-m3u8-to-mp4')
import ora from 'ora'

import format from "../utils/format"
import generateMHTML from "../utils/generateMHTML"
import message from "../utils/message"
import { aulas } from '../../cursos.json'
// import { Aula } from "./getAulas"

interface Atividade {
  titulo: string
  url: string
  hasVideo: boolean
}

const getTitle = (path: string): string => {
  const list = path.split('/')
  list.splice(0, 2)
  const [secao, formacao, passo, curso] = list
  return `⚪ ${secao}\n   ⚫ ${formacao}\n      ⬜ ${passo}\n         ⬛ ${curso}`
}


// função para salvar html e vídeo na pasta ./data
const getPage = async (page: Page, atividade: Atividade, path: string) => {
  console.log(`\t\t\t${atividade.titulo}`)
  const spinner = ora('Baixando HTML...')
  spinner.prefixText = '            '
  spinner.start()
  try {
    let link = ''

    await page.on('response', async (response: HTTPResponse) => {
      const request = response.request()
      if (request.url().endsWith('/video')){
        const data = await response.json()
        link = data[0].link
      }
    })

    await page.goto(atividade.url, { waitUntil: 'networkidle0' })
    
    await generateMHTML(page, path, format(atividade.titulo))
    spinner.succeed('HTML extraído com sucesso')

    if (link) {
      spinner.color = 'yellow'
      spinner.start('Baixando vídeo...')
  
      await converter(link, `${path}/${format(atividade.titulo)}.mp4`)
  
      spinner.succeed('Vídeo baixado com sucesso')
    }
    
  } catch (error) {
    spinner.fail('Falha ao extrair conteúdo da página')
  }
}

// função para acessar todos elementos de atividades
export default async function getAtividades(page: Page) {
  let count = 0
  const aula = aulas[0]
  // for (const aula of (aulas as Aula[])) {
    try {
      count = count + 1
      console.clear()
      const percent = `${count / aulas.length * 100}`
      message.success(`Concluídos: ${count}/${aulas.length} - ${parseFloat(percent).toFixed(2)}%`)
      const title = getTitle(aula.folder)
      console.log(title)

      await page.goto(aula.url, { waitUntil: 'networkidle0' })

      const atividades = await page.evaluate(() => {
        const list = Array.from(document.querySelectorAll<HTMLAnchorElement>('.task-menu-nav-item-link'))
        const atividades = list.map((atividade, index) => {
          const titulo = atividade.querySelector<HTMLSpanElement>('.task-menu-nav-item-title')?.innerText ?? 'error'
          const hasVideo = atividade.querySelector('use')?.href.baseVal.includes('#VIDEO') ?? false
          
          return { titulo: `${index + 1} - ${titulo}`, url: atividade.href, hasVideo }
        })

        return atividades
      })

      for (const atividade of atividades) {
        await getPage(page, atividade, aula.folder)
      }
      
    } catch (error) {
      message.error('Falha ao obter aula')
    }
  // }
}