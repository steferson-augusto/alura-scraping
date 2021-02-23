import ora, { Ora } from 'ora'
import retry from 'async-retry'
const converter = require('node-m3u8-to-mp4')

export default async function saveVideo(
  link: string,
  path: string,
  loader: Ora | undefined = undefined
) {
  const spinner: Ora = loader ?? ora('Baixando vídeo...')
  try {
    if (link) {
      spinner.start('Baixando vídeo...')
      await retry(async (_bail, attempt) => {
        try {
          const textAttempt = attempt > 1 ? ` (tentativa ${attempt}/3)` : ''
          spinner.text = 'Baixando vídeo...' + textAttempt
          await converter(link, `${path}.mp4`)
          spinner.succeed('Vídeo baixado com sucesso')
        } catch (error) {
          throw new Error('Falha ao gerar vídeo')
        }
      }, { retries: 3 })
    }
  } catch (error) {
    spinner.fail('Falha ao baixar vídeo')
    throw new Error('Falha ao baixar vídeo') 
  }
}