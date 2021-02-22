import fs from 'fs'
import axios from 'axios'
import { Page } from "puppeteer"

import createFolder from '../utils/createFolder'
import format from '../utils/format'
import message from '../utils/message'
import { Post } from './getAulas'
import { formacoes } from '../../db.json'

export interface Curso {
  titulo: string
  url: string
}

interface Item {
  titulo: string
  posts: Post[]
}

// função para salvar cursos em db.json
async function fillPosts(itens: Item[], path: string) {
  try {
    const posts = itens.reduce((result, item) => {
      const relativePath = `${path}/${item.titulo}`
      createFolder(relativePath)

      result.push(...item.posts)
      return result
    }, [] as Post[])
    await axios.post('http://localhost:3000/posts', posts)
    message.success('Posts obtidos com sucesso')
  } catch (error) {
    message.error('Falha ao adicionar posts')
  }
}

// função para acessar todos elementos de curso
export default async function getCursos(page: Page) {
  for (const formacao of formacoes) {
    console.log(formacao.titulo)
    for (const curso of formacao.cursos) {
      await page.goto(curso.url, { waitUntil: 'networkidle0' })

      const cdp = await page.target().createCDPSession()
      const { data } = await cdp.send('Page.captureSnapshot', { format: 'mhtml' })
      const path = `./data/${format(formacao.titulo)}/${format(curso.titulo)}`

      createFolder(path)

      fs.writeFileSync(`${path}/index.mhtml`, data)
      
      const itens = await page.evaluate(path => {
        const list = Array.from(document.querySelectorAll('.formacao-passos-passo'))

        const posts = list.map(passo => {
          const numero = passo.querySelector('.formacao-passo-numero')?.textContent ?? ''
          const nome = passo.querySelector('.formacao-passo-nome')?.textContent ?? ''
          const titulo = (`${numero} - ${nome}`).replace(/[\\|:?/*"<>]/g, '')
        
          const listPosts = Array.from(passo.querySelectorAll<HTMLAnchorElement>('.learning-content__link'))
          const posts = listPosts.map(post => ({
            titulo: post.querySelector('.learning-content__name')?.textContent ?? '',
            url: post.href,
            curso: post.querySelector('.learning-content__kind')?.textContent?.toLowerCase().trim() === 'curso',
            folder: `${path}/${titulo}`
          }))

          return { titulo, posts }
        })

        return posts
      }, path)

      await fillPosts(itens, path)
    }
  }
}