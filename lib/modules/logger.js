/*
Instantiate the logger for all modules
*/
const os = require('os')
const fs = require('fs')
/**
 * Logger Module
 * @module modules/logger
 * @version 2.0
 */

/**
 * Default log level is INFO. If .env parameter of NODE_ENV is set to to 'development' then we up the level to DEBUG
 */
var logLevel = 'info'
var logDir = './log/'
/**
  * Create logDir if it does not exist
  */
if (!fs.existsSync(logDir)) {
	fs.mkdirSync(logDir)
}
/**
 * Default log level is INFO. If .env parameter of NODE_ENV is set to to 'development' then we log to the console as well as the file.
 */
var transports = []
var winston = require('winston')
var Rotate = require('winston-logrotate').Rotate

var tsFormat = () => (new Date()).toLocaleString()
if (process.env.NODE_ENV === 'development') {
		logLevel = 'debug'
		transports.push(
			new (winston.transports.Console)({
					timestamp: tsFormat,
					level: logLevel,
					colorize: true,
					handleExceptions: true,
					humanReadableUnhandledException: true
				}))
}

var rotateTransport = new Rotate({
	file: `${logDir}debug.log`,
	timestamp: tsFormat,
	level: logLevel,
	size: '1m',
	keep: 10,
	compress: false,
	handleExceptions: true,
	humanReadableUnhandledException: true,
	exitOnError: true,
	json: true
})

transports.push(rotateTransport)

var logger = new (winston.Logger)({ transports: transports })
module.exports = logger
