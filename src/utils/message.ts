const message = {
  error: (text: string) => {
    console.log('\x1b[31m%s\x1b[0m', text)
  },
  warn: (text: string) => {
    console.log('\x1b[33m%s\x1b[0m', text)
  },
  success: (text: string) => {
    console.log('\x1b[32m%s\x1b[0m', text)
  }
}

export default message