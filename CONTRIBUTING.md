# Developer's Guide to Junknet

## NPM Scripts

The commands you'll use most are listed below. They operate on the TypeScript source code, so there is no separate <q>build step</q> to worry about.

- `start`: Run the daemon program, watching for changes to dependent source files and auto-restarting as needed. Just start this process and leave it running as you work on the daemon.
- `cli`: Run the controller program.
- `fix`: Try to automatically fix linting issues (but not everything can be auto-fixed) and run the formatter.
- `postfix`: Just run the formatter by itself.
- `test`: Run the linter, unit tests, and format checker. This is exactly what Travis does, so always run this locally and make sure it passes before you push.

### For packaging

These commands involve compiling TypeScript to JavaScript.

- `prepare`: Build the project (as JavaScript files, into [dist](dist)) and documentation (as HTML files, into [docs](docs)). There's no need to run this task during your normal development process. This is run automatically on `npm install` or `npm pack`, which means that Travis will run it.
