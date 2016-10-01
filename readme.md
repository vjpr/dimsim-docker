# dimsim-docker-cli

> CLI tool to conveniently run a Dimsim Docker container.
 
## Install

```
npm i -g dimsim-docker-cli 
```
 
## Usage

```
dimsim-docker
```

See `dimsim` project for cli options.

## Why?

Our dimsim tests are stored in the firmware repo which is checked out on the user's local machine. A lot of the time this will be Windows.

We need UNIX pipes for using dimsim. Therefore we need to use Docker on Windows.

To allow Docker to access our test code residing on the host, we need to run docker with some flags. This module sets those flags for us and verifies that everything neccessary is installed.

### Why isn't this bundled in `dimsim`?

NPM sucks on Windows so we don't want to install any dependencies on Windows that we don't have to. Therefore this needs to be a separate module. Native dependencies also need to be compiled for Debian inside Docker.
