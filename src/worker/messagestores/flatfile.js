const fs = require('fs');
const path = require('path');
const { isoTime } = require('../../libs/helpers');

const IrcMessage = require('irc-framework').Message;

const MSG_TYPE_PRIVMSG = 1;
const MSG_TYPE_NOTICE = 2;

class FlatfileMessageStore {
    constructor(conf) {
        this.supportsWrite = true;
        this.supportsRead = false;
        this.logsDir = conf.files;
    }

    async init() {
    }

    async getMessagesFromMsgId(userId, networkId, buffer, fromMsgId, length) {
    }

    async getMessagesFromTime(userId, networkId, buffer, fromTime, length) {
    }

    async getMessagesBeforeMsgId(userId, networkId, buffer, msgId, length) {
    }

    async getMessagesBeforeTime(userId, networkId, buffer, fromTime, length) {
    }

    async getMessagesBetween(userId, networkId, buffer, from, to, length) {
    }

    async storeMessage(message, upstreamCon, clientCon) {
        if (!this.logsDir) {
            return;
        }

        let line = '';
        let bufferName = bufferNameIfPm(message, upstreamCon.state.nick, 0);
        // Messages such as this we don't want to log
        // :2.chimera.network.irc.com NOTICE * :*** Looking up your hostname...
        if (bufferName === '*') {
            return;
        }

        let prefix = clientCon ? clientCon.state.nick : message.nick;
        let time = message.tags.time ? isoTime(new Date(message.tags.time)) : isoTime();

        if (message.command === 'PRIVMSG') {
            line = `[${time}] <${prefix}> ${message.params[1]}`;
        } else if (message.command === 'NOTICE') {
            line = `[${time}] <${prefix}> ${message.params[1]}`;
        } else if (message.command === 'NICK') {
            line = `[${time}] ${message.nick} is now known as ${message.params[0]}`;
        } else if (message.command === 'JOIN') {
            line = `[${time}] *** JOIN: ${message.nick} (${message.ident}@${message.hostname})`;
        } else if (message.command === 'PART') {
            line = `[${time}] *** PART: ${message.nick} (${message.ident}@${message.hostname})`;
            if (message.params[1]) {
                line += ` (${message.params[1]})`;
            }
        } else if (message.command === 'QUIT') {
            line = `[${time}] *** QUIT: ${message.nick} (${message.ident}@${message.hostname})`;
            if (message.params[1]) {
                line += ` (${message.params[1]})`;
            }
        }

        if (!line) {
            return;
        }

        let netName = upstreamCon.state.authNetworkName.toLowerCase();
        let logsDir = path.join(this.logsDir, netName);
        let logFile = path.join(logsDir, bufferName.toLowerCase() + '.log');
        fs.mkdirSync(logsDir, {recursive: true});
        fs.appendFileSync(logFile, line + '\n');
    }
}

module.exports = FlatfileMessageStore;

function bufferNameIfPm(message, nick, messageNickIdx) {
    if (nick.toLowerCase() === message.params[messageNickIdx]) {
        // It's a PM
        return message.nick;
    } else {
        return message.params[messageNickIdx];
    }
}
