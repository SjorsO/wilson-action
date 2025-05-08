import * as core from '@actions/core'
import fs from 'fs'
import os from 'os'
import path from 'path'
import axios, { AxiosError } from 'axios'
import FormData from 'form-data'

export async function run() {
  try {
    let wilsonUrl = core.getInput('url')
    const apiKey = core.getInput('api-key')
    const type = core.getInput('type')
    const swarmName = core.getInput('swarm')
    let bundleFilePath = core.getInput('bundle')
    const maxAttempts = core.getInput('max-attempts')
    const envValues = core.getInput('env')
    const phpIniValues = core.getInput('php-ini')

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
    form.append('swarm', swarmName)
    form.append('repository', process.env.GITHUB_REPOSITORY)
    form.append('type', type)
    form.append('max_attempts', maxAttempts)
    form.append('env', envValues)
    form.append('php_ini', phpIniValues)

    const response = await axios.postForm(`${wilsonUrl}/api/run`, form, {
      headers: {
        'Wilson-Api-Key': apiKey,
        'Content-Disposition': 'attachment; filename="wilson-bundle.tar.gz"',
        'Content-Type': 'multipart/form-data'
      }
    })

    const dashboardUrl = response.data.dashboard_url;
    const statusUrl = response.data.status_url;

    core.info('View details about this run: ' + dashboardUrl)

    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 3000))

      const response = await axios.get(statusUrl, {
        headers: {
          'Wilson-Api-Key': apiKey,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.has_finished) {
        return
      }

      if (response.data.has_failed) {
        core.setFailed('Wilson run failed, details: ' + dashboardUrl)

        return
      }

      console.log(response.data.status_text)
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      core.setFailed(
        `${error.message} (${error.response?.statusText}): ${JSON.stringify(error.response?.data)}`
      )
    } else {
      core.setFailed(error.message)
    }
  }
}
