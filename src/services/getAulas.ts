import axios from "axios"
import { Page } from "puppeteer"
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

export interface Aula {
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

// função para acessar todos elementos de curso
export default async function getAulas(page: Page) {
  try {
    let count = 0
    for (const post of posts) {
      count = count + 1
      console.clear()
      console.log(post.titulo)
      const percent = `${count / posts.length * 100}`
      message.success(`Concluídos: ${count}/${posts.length} - ${parseFloat(percent).toFixed(2)}%`)
      if (post.curso) {
        const path = `${post.folder}/${format(post.titulo)}`
        await page.goto(post.url, { waitUntil: 'networkidle0' })

        const aulas = await page.evaluate((path: string) => {
          const list = Array.from(document.querySelectorAll<HTMLAnchorElement>('.courseSectionList-section'))
          const aulas = list.map((aula, index) => {
            const element = aula.querySelector<HTMLDivElement>('.courseSectionList-sectionTitle')
            const titulo = `${index + 1} - ${element?.innerText ?? 'error'}`

            return { titulo , url: aula.href, folder: path }
          })

          return aulas
        }, path)
        
        await generateMHTML(page, path)
        await fillAulas(aulas)
      } else {
        await page.goto(post.url, { waitUntil: 'networkidle0' })
        await generateMHTML(page, post.folder, format(post.titulo))
      }
    }
  } catch (error) {
    console.error(JSON.stringify(error, null, 2))
  }
}