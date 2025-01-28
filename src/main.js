import * as core from '@actions/core'
import fs from 'fs'
import os from 'os'
import path from 'path'
import axios, { AxiosError } from 'axios'
import FormData from 'form-data'

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
    form.append('bundle', fs.createReadStream(bundleFilePath))
    form.append('wilsonFileFileName', wilsonFileFileName)

    const response = await axios.postForm(wilsonUrl + '/api/run', form, {
      headers: {
        'Wilson-Api-Key': apiKey,
        'Content-Disposition': 'attachment; filename="wilson-bundle.tar.gz"',
        'Content-Type': 'multipart/form-data'
      }
    })

    console.log(response.data)
  } catch (error) {
    if (error instanceof AxiosError) {
      core.setFailed(
        `${error.message} (${error.response?.statusText}): ${JSON.stringify(error.response?.data)}`
      )
    } else if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}
