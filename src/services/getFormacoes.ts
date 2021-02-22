import axios from "axios"
import { Page } from "puppeteer"

import message from "../utils/message"
import { Curso } from "./getCursos"

export interface Formacao {
  titulo: string
  cursos: Curso[]
}

// função para salvar formações em db.json
export async function fillFormacoes(formacoes: Formacao[]) {
  try {
    await axios.post('http://localhost:3000/formacoes', formacoes)
  } catch (error) {
    message.error('Falha ao adicionar formacao')
  }
}

// função para acessar todos elementos de formação
export default async function getFormacoes(page: Page) {
  await page.goto('https://cursos.alura.com.br/formacoes', { waitUntil: 'networkidle2' })

  const formacoes = await page.evaluate(() => {
    const list = Array.from(document.querySelectorAll('.formacoes__item'))

    const formacoes = list.map(element => {
      const titulo = element.querySelector('.formacoes__category-name')?.textContent ?? ''
      const formacoes = Array.from(element.querySelectorAll<HTMLAnchorElement>('.formacao__link'))
      const cursos = formacoes.map(curso => ({
        titulo: curso.querySelector('.formacao__title')?.textContent ?? '',
        url: curso.href
      }))

      return { titulo, cursos }
    })
    
    return formacoes
  })

  fillFormacoes(formacoes)
}