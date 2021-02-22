import fs from 'fs'
import message from './message'

export default function createFolder(path: string): void {
  try {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true })
    }
  } catch (error) {
    message.error('Falha ao cria diretório')
  }
}