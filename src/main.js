import * as core from '@actions/core'
import fs from 'fs'
import request from 'request'

export async function run() {
  try {
    let wilsonUrl = core.getInput('url')
    const apiKey = core.getInput('api_key')
    const wilsonFileFileName = core.getInput('config')
    const bundleFilePath = core.getInput('bundle')

    if (!fs.existsSync(bundleFilePath)) {
      core.setFailed(`Bundle file does not exist at [${bundleFilePath}]`)

      return
    }

    if (wilsonUrl.endsWith('/')) {
      wilsonUrl = wilsonUrl.slice(0, -1)
    }

    const form = request.form()

    form.append('file', fs.createReadStream(bundleFilePath))

    request(
      {
        headers: {
          'Wilson-Api-Key': apiKey,
          'Wilson-File-Name': wilsonFileFileName
        },
        uri: wilsonUrl + '/api/run',
        body: form,
        method: 'POST'
      },
      function (err, res, body) {
        const bodyValues = JSON.parse(body)

        console.log(err)
        console.log(bodyValues)
      }
    )
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
