import * as core from '@actions/core'
import fs from 'fs'
import os from 'os'
import path from 'path'
import axios from 'axios'

export async function run() {
  try {
    let wilsonUrl = core.getInput('url')
    const apiKey = core.getInput('api_key')
    const wilsonFileFileName = core.getInput('config')
    let bundleFilePath = core.getInput('bundle')

    if (bundleFilePath.startsWith('~')) {
      bundleFilePath = path.join(os.homedir(), bundleFilePath.slice(1))
    }

    if (!fs.existsSync(bundleFilePath)) {
      core.setFailed(`Bundle file does not exist at [${bundleFilePath}]`)

      return
    }

    if (wilsonUrl.endsWith('/')) {
      wilsonUrl = wilsonUrl.slice(0, -1)
    }

    const form = new FormData()

    form.append('file', fs.createReadStream(bundleFilePath))

    const response = await axios.post(wilsonUrl + '/api/run', form, {
      headers: {
        ...form.getHeaders(),
        'Wilson-Api-Key': apiKey,
        'Wilson-File-Name': wilsonFileFileName
      }
    })

    console.log(response.data)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}
