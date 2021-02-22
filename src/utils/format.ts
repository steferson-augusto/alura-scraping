export default function format(text: string) {
  return text.replace(/[\\|:?/.*"<>]/g, '')
}