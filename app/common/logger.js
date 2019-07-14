const log4js = require('log4js'); 

log4js.configure({
    appenders: {
        console: {  
            type: 'console'
        },
        file: {
            type: 'dateFile',
            filename: './logs/log',
            alwaysIncludePattern: true,
            pattern: '-yyyy-MM-dd-hh.log',
            encoding: 'utf-8',
            maxLogSize: 10
        },
        filter: {
            type: 'logLevelFilter',
            level: log4js.levels.WARN,
            appender: 'file'
        }
    },
    categories: {
        default: {
            appenders: ['console', 'filter'],
            level: 'all'
        }
    },
    replaceConsole: true
});

module.exports = log4js.getLogger();
