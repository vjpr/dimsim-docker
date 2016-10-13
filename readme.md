# dimsim-docker

CLI tool to conveniently run a Dimsim Docker container.

## Install

```bash
npm i -g dimsim-docker
```
 
## Usage

This should be run from the Docker *host* OS. It is only neccessary to use this wrapper on Windows when using the simulator. For macOS and Linux you can use `dimsim` directly.

```bash
dimsim-docker <command>
```

Running `dimsim-docker help` will show you help for `dimsim-docker` and also `dimsim`.

See [Dimsim](https://github.com/quantitec/dimsim) project for more info.

## Why?

Our dimsim tests are stored in the firmware repo which is checked out on the user's local machine. A lot of the time this will be Windows.

We need UNIX pipes for using dimsim. Therefore we need to use Docker on Windows.

To allow Docker to access our test code residing on the host, we need to run docker with some flags. This module sets those flags for us and verifies that everything neccessary is installed.

### Why isn't this bundled in `dimsim`?

NPM sucks on Windows so we don't want to install any dependencies on Windows that we don't have to. Therefore this needs to be a separate module. Native dependencies also need to be compiled for POSIX inside Docker.

## Development

```bash
pnpm install # add `--no-optional` on Windows
gulp watch
node . help
```

## Author

[Vaughan Rouesnel - @vjpr](https://github.com/vjpr)

## License

MIT
