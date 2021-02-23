import { HTTPResponse, Page } from 'puppeteer'
import ora from 'ora'
import retry from 'async-retry'

import format from '../utils/format'
import generateMHTML from '../utils/generateMHTML'
import message from '../utils/message'
import { aulas } from '../../cursos.json'
import login from './login'
import saveVideo from './saveVideo'

interface Atividade {
  titulo: string
  url: string
  hasVideo: boolean
}

const getTitle = (path: string): string => {
  const list = path.split('/')
  list.splice(0, 2)
  const [secao, formacao, passo, curso, aula] = list
  return `⚪ ${secao}\n   ⚫ ${formacao}\n      ⬜ ${passo}\n         ⬛ ${curso}\n            ${aula}`
}

// função para salvar html e vídeo na pasta ./data
const getPage = async (page: Page, atividade: Atividade, path: string) => {
  console.log(`               ${atividade.titulo}`)
  const spinner = ora('Extraindo dados...')
  spinner.prefixText = '                  '
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

    const loggedIn = await retry(async () => {
      // if anything throws, we retry
      await page.goto(atividade.url, { waitUntil: 'networkidle0' })

      const loggedIn = await page.evaluate(() => {
        const user = document.querySelector<HTMLSpanElement>('.task-menu-footer-detalhes-nome')?.innerText
        return user === 'Cristhian Elson Pereira Macedo'
      })
     
      if (!loggedIn) {
        // retry se usuário não estiver logado
        await login(page, '               ')
        throw new Error('Usuário não logado')
      }

      return loggedIn
    }, {
      retries: 3
    })
    
    if (!loggedIn) {
      spinner.fail('Usuário não logado')
      throw new Error('Usuário não logado')
    }
    
    await generateMHTML(page, path, format(atividade.titulo), spinner)
    await saveVideo(link, `${path}/${format(atividade.titulo)}`, spinner)

  } catch (error) {
    spinner.fail('Falha ao extrair conteúdo da página')
    throw new Error('Falha ao extrair conteúdo da página')    
  }
}

// função para acessar todos elementos de atividades
export default async function getAtividades(page: Page, start: number = 0) {
  let count = 0
  const list = start > 0 ? aulas.slice(start) : aulas
  for (const aula of list) {
    try {
      count = count + 1
      console.clear()
      const percent = `${count / list.length * 100}`
      message.success(`Concluídos: ${count}/${list.length} - ${parseFloat(percent).toFixed(2)}%`)
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
      throw new Error('Falha ao obter aula')      
    }
  }
}