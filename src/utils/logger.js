"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.error = exports.warn = exports.info = exports.debug = exports.logger = exports.LogLevel = void 0;
// src/lib/utils/logger.ts
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor() {
        this.isDevelopment = process.env.NODE_ENV === 'development';
        // Set log level based on environment
        this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
    }
    shouldLog(level) {
        return level >= this.logLevel;
    }
    formatMessage(level, message, context) {
        const timestamp = new Date().toISOString();
        const levelName = LogLevel[level];
        const contextStr = context ? ` ${JSON.stringify(context)}` : '';
        return `[${timestamp}] [${levelName}] ${message}${contextStr}`;
    }
    log(level, message, context) {
        if (!this.shouldLog(level))
            return;
        const formattedMessage = this.formatMessage(level, message, context);
        switch (level) {
            case LogLevel.DEBUG:
                console.debug(formattedMessage);
                break;
            case LogLevel.INFO:
                console.info(formattedMessage);
                break;
            case LogLevel.WARN:
                console.warn(formattedMessage);
                break;
            case LogLevel.ERROR:
                console.error(formattedMessage);
                break;
        }
    }
    debug(message, context) {
        this.log(LogLevel.DEBUG, message, context);
    }
    info(message, context) {
        this.log(LogLevel.INFO, message, context);
    }
    warn(message, context) {
        this.log(LogLevel.WARN, message, context);
    }
    error(message, context) {
        this.log(LogLevel.ERROR, message, context);
    }
    // Create a logger with a specific prefix for better organization
    createLogger(prefix) {
        return {
            debug: (message, context) => this.debug(`[${prefix}] ${message}`, context),
            info: (message, context) => this.info(`[${prefix}] ${message}`, context),
            warn: (message, context) => this.warn(`[${prefix}] ${message}`, context),
            error: (message, context) => this.error(`[${prefix}] ${message}`, context),
        };
    }
}
// Export singleton instance
exports.logger = new Logger();
// Export convenience functions
const debug = (message, context) => exports.logger.debug(message, context);
exports.debug = debug;
const info = (message, context) => exports.logger.info(message, context);
exports.info = info;
const warn = (message, context) => exports.logger.warn(message, context);
exports.warn = warn;
const error = (message, context) => exports.logger.error(message, context);
exports.error = error;
