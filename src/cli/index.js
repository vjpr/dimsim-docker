const dotenvConfig = require('dotenv').config({silent: true})
import {spawnSync} from 'child_process'
import path, {join} from 'path'
import _ from 'lodash'
import pkgConf from 'pkg-conf'
import exit from 'exit'
import Debug from 'debug'
import indentString from 'indent-string'
import Yargs from 'yargs'
import untildify from 'untildify'
import toSpawnArgs from 'modules/to-spawn-args'
import execa from 'execa'
const debug = Debug('dimsim-docker-cli')

////////////////////////////////////////////////////////////////////////////////

process.on('unhandledRejection', (e) => {
  console.error('error:', e)
  exit()
})

////////////////////////////////////////////////////////////////////////////////

function mergeArrays(a, b) {
  return Array.isArray(a) ? _.union(a, b) : undefined
}

//
// To debug:
//
// DEBUG=* dimsim-docker --docker.dimsim-src=~/dev-live/dimsim --docker.shell
//

export default function() {

  // TODO(vjpr): Check that Docker for Windows is installed. Offer to open
  //   browser to install page.

  let runDockerShell = false

  const yargs = Yargs
    .usage('Usage: $0 <command> [options]')
    .command('docker-shell', 'Open /bin/bash in the Docker container for debugging.', (yargs) => {
      runDockerShell = true
    })
    .command('docker-ps', 'Show all running containers.', (yargs) => {
      const cmd = 'docker ps'
      console.log('Running:', cmd)
      const out = execa.shellSync(cmd)
      console.log(out.stdout)
      exit()
    })
    .command('docker-clean', 'Remove all containers. Useful if something gets stuck.', (yargs) => {
      // TODO(vjpr): Figure out a cross-platform command.
      // TODO(vjpr): Add error handling.
      const cmd = 'docker rm -f $(docker ps -a -q)'
      console.log('Running:', cmd)
      const out = execa.shellSync(cmd)
      console.log(out.stdout)
      exit()
    })
    .describe('docker.debug', 'Enable debug logging inside the container.')
    .describe('docker.dimsim-src', 'Path to the dimsim working dir for use during dimsim development.')
    .describe('help', 'Show dimsim-docker-cli and dimsim help.')
  const argv = yargs.parse(process.argv)

  const dockerOpts = argv.docker || {}

  console.log('NOTE: This cli tool will be run inside a Docker container')

  if (argv.help || argv._.length <= 2) {
    console.log('='.repeat(80))
    console.log('Docker Wrapper (dimsim-docker-cli) Help\n')
    yargs.showHelp()
    console.log('='.repeat(80))
  }

  const config = getConfig()

  const image = getDockerImage(config)
  if (!image) return

  const cmd = 'docker'

  let cmdToRun = process.argv.slice(2)

  // TODO(vjpr): Rename to run flags.
  let flags = {
    interactive: true,
    tty: true,
    rm: true,
    // This is used for mapping the real path.
    env: {
      values: ['DIMSIM_CODE_HOST_PWD=$PWD'],
    },
    volume: {
      values: [
        '$PWD:/code',
        // Would not support Windows I don't think.
        //'/var/run/docker.sock:/var/run/docker.sock',
        // Do we need this? This is where we are storing pipes in the container.
        //'/tmp/dimsim:/tmp/dimsim',
      ],
    },
    // Default gdb server port. QEMU run gdbserver.
    p: '1234:1234',
  }

  // TODO(vjpr): Convert to function.
  // Whilst developing dimsim we must point to our dev dimsim repo.
  let dimsimSrc = dockerOpts['dimsim-src'] || process.env.DIMSIM_SRC
  if (dimsimSrc) {
    let logStr = `Running in dev mode. Using a shared volume for dimsim src running in Docker container.\n`
    if (process.env.DIMSIM_SRC) {
      logStr += `From env var: DIMSIM_SRC=${dimsimSrc}.`
      if (dotenvConfig.DIMSIM_SRC) logStr += ` Set in the ${`.env`} file.`
    } else if (dockerOpts['dimsim-src']) {
      logStr += `From cli: --dimsim-src=${dimsimSrc}`
    }
    console.log(logStr)
    dimsimSrc = untildify(dimsimSrc)
    const appNodeModulesInDocker = '/home/app/current/node_modules'
    _.mergeWith(flags, {
      env: {
        values: [`DIMSIM_SRC=${dimsimSrc}`],
      },
      volume: {
        values: [
          `${dimsimSrc}:/home/app/current`,
          `dimsim-node_modules:${appNodeModulesInDocker}`,
        ]
      }
    }, mergeArrays)

    // TODO(vjpr): Get from cli.
    //const npmLinkedModules = ['zog']
    //const dimsimSrcDir = dimsimSrc
    //useVolumesForNpmLinkedModules({flags, npmLinkedModules, dimsimSrcDir, appNodeModulesInDocker})

  }

  if (runDockerShell) {
    flags.entrypoint = '/bin/bash'
    // Otherwise we can't play around with `apt-get install`, etc.
    flags.user = 'root'
    cmdToRun = null
  }

  let argsStr = [
    'run',
    toSpawnArgs(flags),
    image,
    cmdToRun,
  ]

  let args = _(argsStr).castArray().flatten().value().join(' ')
    .replace(/\s\s+/g, ' ').split(' ').filter(Boolean)

  let fullCmdStr = `${cmd} ${args.join(' ')}`

  debug('full cmd str:', fullCmdStr)

  args = args.map(replaceEnvVars)

  debug('spawn cmd:', cmd)
  debug('spawn args:', args)

  const proc = spawnSync(cmd, args, {
    stdio: 'inherit',
    detached: true,
  })

}

function getConfig() {
  return pkgConf.sync('dimsim', {
    defaults: {
      image: null,
    }
  })
}

function getDockerImage(config) {
  if (config.image) return config.image
  console.log('You must specify an image in your package.json file or using the --image flag.')
  return
}

function replaceEnvVars(str) {
  const replaced = str.replace(/\$(\w+)/g, (_, match) => {
    return process.env[match]
  })
  return replaced
}

function useVolumesForNpmLinkedModules({flags, npmLinkedModules, dimsimSrcDir, appNodeModulesInDocker}) {
  const basedir = dimsimSrcDir
  // Find full paths for npm linked modules.
  const resolvedPaths = npmLinkedModules.map(p => {
    const resolvedPath = join(basedir, 'node_modules', p)
    const dockerPath = join(appNodeModulesInDocker, p)
    return `${resolvedPath}:${dockerPath}`
  })
  _.mergeWith(flags, {volume: {values: resolvedPaths}}, mergeArrays)
}
