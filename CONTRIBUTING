# Developer's Guide to Junknet

## NPM Scripts

### For development

The commands you should use most of the time. They operate on the TypeScript source code, so there is no separate <q>build step</q> to worry about.

- `start:dev`: Run the daemon program, watching for changes to dependent source files and auto-restarting as needed. Just start this process and leave it running as you work on the daemon.
- `cli:dev`: Run the controller program.
- `fix`: Try to automatically fix linting issues (but not everything can be auto-fixed) and run the formatter.
- `postfix`: Just run the formatter by itself.
- `test`: Run the linter, unit tests, and format checker. This is exactly what Travis does, so always run this locally and make sure it passes before you push.

### For packaging

These commands involve compiling TypeScript to JavaScript.

- `prepare`: Build the project. This will write the build output as JavaScript files into [dist](dist). There's no need to run this task during your normal development process. This is run automatically on `npm install` or `npm pack`, which means that Travis will run it.
- `start`: Run the server from the built project ([dist](dist)). You must build the project first.
- `cli`: Run the controller from the built project ([dist](dist)). You must build the project first.
