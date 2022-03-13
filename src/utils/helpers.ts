export class Helpers {
  blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  }

  downloadBase64File(contentBase64, fileName) {
    if (contentBase64.match('base64,'))
      contentBase64 = contentBase64.substr(contentBase64.indexOf('base64,') + 7)

    const linkSource = `data:application/pdf;base64,${contentBase64}`
    const downloadLink = document.createElement('a')
    document.body.appendChild(downloadLink)

    downloadLink.href = linkSource
    downloadLink.target = '_self'
    downloadLink.download = fileName
    downloadLink.click()
  }
}

export const useHelpers = (): Helpers => {
  return new Helpers()
}
