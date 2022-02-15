const chalk = require("chalk");

const dumpError = (err) => {
    if (typeof err === 'object') {
        // if (err.message) {
        //     console.log(chalk.blueBright('\nMessage: ' + err.message));
        // }
        if (err.stack) {
            console.log(chalk.redBright('\nStacktrace:'));
            console.log(chalk.redBright('===================='));
            console.log(chalk.redBright(err.stack));
        }
    } else {
        console.log(chalk.redBright('dumpError :: argument is not an object'));
    }
};

module.exports = dumpError;