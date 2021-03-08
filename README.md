# Junknet

Zero-config distributed parallel processing. Junknet can parallelize your existing Makefiles among any number of machines on your LAN.

## User Information

For installation/usage help, please see our [user manual](https://github.com/cs130-w21/1/wiki/User-Manual).

## Prerequisites

- [Docker](https://www.docker.com)

## Developer's Guide

Our program's internal documentation is presented [here](https://junknet.netlify.app/).

The [NPM scripts](https://docs.npmjs.com/cli/v7/using-npm/scripts) you'll use most are listed below. They operate on the TypeScript source code, so there is no separate <q>build step</q> to worry about.

- `start`: Run the daemon program, watching for changes to dependent source files and auto-restarting as needed. Just start this process and leave it running as you work on the daemon.
- `cli`: Run the controller program once. Use `--` to pass arguments to it.
- `fix`: Try to automatically fix linting issues (but not everything can be auto-fixed) and run the formatter.
- `postfix`: Just run the formatter by itself.
- `test`: Run the type checker, unit and integration tests, linter, and format checker. This is exactly what CI/CD does, so if you have all external dependencies set up, it's a good idea to run this before you push.
  - You must have Docker running when you run `test`.
- `test:local`: Like `test`, but skip integration tests. Always run this locally and make sure it passes before you commit.

### For packaging

- `prepack`: Build the project as JavaScript files into [dist](dist). There's no need to run this task during your normal development process. This is run automatically when the package is distributed (`npm pack`) and/or published to NPM.
- `docs`: Build the documentation website as HTML files into [docs](docs). This is run by CI/CD and automatically hosted online. Optionally, you can run it yourself to scan for broken links and get a local copy.

## External Dependencies

To be able to run the integration tests locally, you'll need:

- [Docker Engine](https://docs.docker.com/engine/), latest stable version.
- [GNU Make](https://www.gnu.org/software/make/), version 4.3.

### Windows

The easiest way to install Make is using the [Scoop](https://scoop.sh/) package manager:

    scoop install make

The easiest way to install the Docker daemon is via [Docker Desktop](https://hub.docker.com/editions/community/docker-ce-desktop-windows).
