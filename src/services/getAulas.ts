import axios from "axios"
import { Page } from "puppeteer"
import ora from "ora"

import format from '../utils/format'
import generateMHTML from '../utils/generateMHTML'
import message from "../utils/message"
import { posts } from '../../db.json'

export interface Post {
  titulo: string
  url: string
  curso: boolean
  folder: string
}

interface Aula {
  titulo: string
  url: string
  folder: string
}

// função para salvar aulas em cursos.json
async function fillAulas(aulas: Aula[]) {
  try {
    await axios.post('http://localhost:3000/aulas', aulas)
  } catch (error) {
    message.error('Falha ao adicionar aulas')
  }
}

const getTitle = (path: string): string => {
  const list = path.split('/')
  list.splice(0, 2)
  const [secao, formacao, passo] = list
  return `⚪ ${secao}\n   ⚫ ${formacao}\n      ⬜ ${passo}`
}

// função para acessar todos elementos de curso
export default async function getAulas(page: Page) {
  let count = 0
  for (const post of posts) {
    count = count + 1
    console.clear()
    const percent = `${count / posts.length * 100}`
    message.success(`Concluídos: ${count}/${posts.length} - ${parseFloat(percent).toFixed(2)}%`)
    const title = getTitle(post.folder)
    console.log(title)

    const spinner = ora('Extraindo dados...')
    spinner.prefixText = '            '
    spinner.start()
    try {
      if (post.curso) {
        const path = `${post.folder}/${format(post.titulo)}`
        await page.goto(post.url, { waitUntil: 'networkidle0' })

        const aulas = await page.evaluate((path: string) => {
          const list = Array.from(document.querySelectorAll<HTMLAnchorElement>('.courseSectionList-section'))
          const aulas = list.map((aula, index) => {
            const element = aula.querySelector<HTMLDivElement>('.courseSectionList-sectionTitle')
            const titulo = `${index + 1} - ${element?.innerText ?? 'error'}`
            const folder = `${path}/${titulo.replace(/[\\|:?/.*"<>]/g, '')}`

            return { titulo , url: aula.href, folder }
          })

          return aulas
        }, path)

        spinner.text ='Baixando HTML...'
        await generateMHTML(page, path)
        spinner.succeed('HTML extraído com sucesso')

        spinner.color = 'blue'
        spinner.start('Salvando dados...')
        await fillAulas(aulas)
        spinner.succeed('Dados salvos com sucesso')
      } else {
        spinner.text ='Baixando HTML...'
        await page.goto(post.url, { waitUntil: 'networkidle0' })
        await generateMHTML(page, post.folder, format(post.titulo))
        spinner.succeed('HTML extraído com sucesso')
      }
    } catch (error) {
      spinner.fail('Falha ao obter/salvar aulas')
    }
  }
}