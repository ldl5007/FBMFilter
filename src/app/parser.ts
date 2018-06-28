import * as fs from "fs";
import * as path from "path";
import * as moment from "moment";
import { JSDOM } from "jsdom";
import { LogMessage, ProgressUpdate, IOperationData } from "../app/interfaces/thread-message.interface";

const MESSAGE_QUERY_STRING = '.pam._3-95._2pi0._2lej.uiBoxWhite.noborder';
const MESSAGE_TITLE_QUERY_STRING = '._3-96._2pio._2lek._2lel';
const MESSAGE_CONTENT_QUERY_STRING = '._3-96._2let';
const MESSAGE_TIMESTAMP_QUERY_STRING = '._3-94._2lem';

const TIMESTAMP_FORMAT = 'MMM DD, YYYY hh:mmA';

class ParsedMessage {
    public element: Element;
    public title: string;
    public content: string;
    public timestamp: string;
}

class MessageStatistic {
    [key: string]: Statistic;
}

class Statistic {
    element: Element;
    startTime: moment.Moment = null;
    endTime: moment.Moment = null;
    messageCount: number = 0;
}

process.on("message", (operationData: IOperationData) => {
    if (operationData.callFilter) {
        filterCalls(operationData.fullPath, "CallLog.html");
    } 

    if (operationData.messagesSummary) {
        messagesSummary(operationData.fullPath, operationData.summaryType, "MessageStatistic.html");
    }
});

function sendMessage(message: string) {
    process.send(new LogMessage(message));
};

function filterCalls(filePath: string, saveFileName: string) {
    console.log(filePath);
    let foundMessages = 0;
    const parsedMessages: ParsedMessage[] = [];

    try {
        // Read file content
        sendMessage(`Start processing ${path.basename(filePath)}...`);
        const fileContent = fs.readFileSync(filePath);

        // Build DOM from file content
        sendMessage(`Loading ${path.basename(filePath)}...`);
        const dom = new JSDOM(fileContent);

        // Query for all messages within the DOM
        sendMessage('Searching for messages...');
        const messages = dom.window.document.querySelectorAll(MESSAGE_QUERY_STRING);

        // Loop throught all of the messages and filter out only message with "duration"
        sendMessage('Extracting messages informations...');
        for (let index = 0; index < messages.length; index++) {
            const message = messages[index];

            if (index % 100 === 0 || index === messages.length - 1) {
                process.send(new ProgressUpdate(index, messages.length - 1));
            }

            const parsedMessage = new ParsedMessage();
            parsedMessage.element = message;

            const titleElement = message.querySelector(MESSAGE_TITLE_QUERY_STRING);
            const contentElement = message.querySelector(MESSAGE_CONTENT_QUERY_STRING);
            const timestampElement = message.querySelector(MESSAGE_TIMESTAMP_QUERY_STRING);

            if (titleElement && contentElement && timestampElement) {
                parsedMessage.title = titleElement.textContent;
                parsedMessage.content = contentElement.textContent;
                parsedMessage.timestamp = timestampElement.textContent;
                parsedMessages.push(parsedMessage);
            }
        }
        sendMessage('Extracting messages informations completed');
        sendMessage(`Found ${parsedMessages.length} messages.`);

        sendMessage('Filtering for call messages...');
        parsedMessages.forEach((message: ParsedMessage, index: number) => {
            if (index % 100 === 0 || index === parsedMessages.length - 1) {
                process.send(new ProgressUpdate(index, parsedMessages.length - 1));
            }

            if (!message.content.includes('Duration')) {
                message.element.parentElement.removeChild(message.element);
            }
            else {
                foundMessages++;
            }
        });
        sendMessage('Filtering for call messages completed');
        sendMessage(`Found ${foundMessages} call messages`);

        // Write filter data to file.
        const outFileName = filePath.replace(path.basename(filePath), saveFileName);;
        fs.writeFileSync(outFileName, dom.window.document.documentElement.outerHTML);
        sendMessage(`Write Data to ${outFileName}`);
    } catch (error) {
        sendMessage(error.message);
    }
}

function messagesSummary(filePath: string, summaryType: string, saveFileName: string) {
    console.log(filePath);
    let foundMessages = 0;
    const parsedMessages: ParsedMessage[] = [];

    try {
        // Read file content
        sendMessage(`Start processing ${path.basename(filePath)}...`);
        const fileContent = fs.readFileSync(filePath);

        // Build DOM from file content
        sendMessage(`Loading ${path.basename(filePath)}...`);
        const dom = new JSDOM(fileContent);

        // Query for all messages within the DOM
        sendMessage('Searching for messages...');
        const messages = dom.window.document.querySelectorAll(MESSAGE_QUERY_STRING);

        // Loop throught all of the messages and filter out only message with "duration"
        sendMessage('Extracting messages informations...');
        for (let index = 0; index < messages.length; index++) {
            const message = messages[index];

            if (index % 100 === 0 || index === messages.length - 1) {
                process.send(new ProgressUpdate(index, messages.length - 1));
            }

            const parsedMessage = new ParsedMessage();
            parsedMessage.element = message;

            const titleElement = message.querySelector(MESSAGE_TITLE_QUERY_STRING);
            const contentElement = message.querySelector(MESSAGE_CONTENT_QUERY_STRING);
            const timestampElement = message.querySelector(MESSAGE_TIMESTAMP_QUERY_STRING);

            if (titleElement && contentElement && timestampElement) {
                parsedMessage.title = titleElement.textContent;
                parsedMessage.content = contentElement.textContent;
                parsedMessage.timestamp = timestampElement.textContent;
                parsedMessages.push(parsedMessage);
            }
        }
        sendMessage('Extracting messages informations completed');
        sendMessage(`Found ${parsedMessages.length} messages.`);

        const messageStat: MessageStatistic = gatherMessageStatistic(parsedMessages, summaryType);

        for (const timeVal in messageStat) {
            if (messageStat.hasOwnProperty(timeVal)) {
                const stat: Statistic = messageStat[timeVal];

                const blockTitle = `From ${stat.startTime.format(TIMESTAMP_FORMAT)} to ${stat.endTime.format(TIMESTAMP_FORMAT)}`;
                stat.element.querySelector(MESSAGE_TITLE_QUERY_STRING).innerHTML = blockTitle;

                const blockContent = `Total messages count: ${stat.messageCount}`; 
                stat.element.querySelector(MESSAGE_CONTENT_QUERY_STRING).innerHTML = blockContent;
                stat.element.querySelector(MESSAGE_TIMESTAMP_QUERY_STRING).innerHTML = "";
            }
        }

        // Write filter data to file.
        const outFileName = filePath.replace(path.basename(filePath), saveFileName);;
        fs.writeFileSync(outFileName, dom.window.document.documentElement.outerHTML);
        sendMessage(`Write Data to ${outFileName}`);

    } catch (error) {
        sendMessage(error.message);
    }
}


function gatherMessageStatistic(parsedMessages: ParsedMessage[], summaryType: string): MessageStatistic {
    const messageStat: MessageStatistic = {};
    let startTime: moment.Moment
    let endTime: moment.Moment

    sendMessage('Gathering messages statistic ...');
    parsedMessages.forEach((message: ParsedMessage, index: number) => {
        if (index % 100 === 0 || index === parsedMessages.length - 1) {
            process.send(new ProgressUpdate(index, parsedMessages.length - 1));
        }

        // Load current time stamp value
        const timestamp: moment.Moment = moment(message.timestamp.trim(), [TIMESTAMP_FORMAT]);

        // Calculating the start time and end time depend on the type of summary
        if (summaryType === 'monthly') {
            startTime = moment({ 'year': timestamp.year(), 'month': timestamp.month() });
            endTime = moment(startTime).add(1, 'months');
        } else if (summaryType === 'weekly') {
            startTime = moment(timestamp);
            startTime.set({ "day": 0, "hours": 0, "minutes": 0 });
            endTime = moment(startTime).add(1, 'weeks');
        }

        // If the timestamp is between the start and end time then add it to a block.
        if (timestamp.isBetween(startTime, endTime)) {
            if (!messageStat.hasOwnProperty(startTime.toString())) {
                messageStat[startTime.toString()] = new Statistic();
                messageStat[startTime.toString()].element = message.element;
            } else {
                message.element.parentElement.removeChild(message.element);
            }

            // Update the start time when found an earlier timestamp
            if (messageStat[startTime.toString()].startTime === null) {
                messageStat[startTime.toString()].startTime = timestamp;
            } else {
                if (messageStat[startTime.toString()].startTime.isAfter(timestamp)) {
                    messageStat[startTime.toString()].startTime = timestamp;
                }
            }

            // Update end time when found later timestamp
            if (messageStat[startTime.toString()].endTime === null) {
                messageStat[startTime.toString()].endTime = timestamp;
            } else {
                if (messageStat[startTime.toString()].endTime.isBefore(timestamp)) {
                    messageStat[startTime.toString()].endTime = timestamp;
                }
            }

            // Update message count
            messageStat[startTime.toString()].messageCount++;
        }
    });
    sendMessage('Gathering messages statistic completed');

    console.log(JSON.stringify(messageStat));
    return messageStat;
}