import * as fs from "fs";
import * as path from "path";
import * as moment from "moment";
import * as cheerio from "cheerio";
import { LogMessage, ProgressUpdate, IOperationData } from "../app/interfaces/thread-message.interface";

const MESSAGE_QUERY_STRING = '.pam._3-95._2pi0._2lej.uiBoxWhite.noborder';
const MESSAGE_TITLE_QUERY_STRING = '._3-96._2pio._2lek._2lel';
const MESSAGE_CONTENT_QUERY_STRING = '._3-96._2let';
const MESSAGE_TIMESTAMP_QUERY_STRING = '._3-94._2lem';

const TIMESTAMP_FORMAT = 'MMM DD, YYYY hh:mmA';

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

    sendMessage("Operation completed.");
});

function sendMessage(message: string) {
    process.send(new LogMessage(message));
};

function filterCalls(filePath: string, saveFileName: string) {
    console.log(filePath);
    let foundMessages = 0;
    let messageCount = 0;

    try {
        // Read file content
        sendMessage(`Start processing ${path.basename(filePath)}...`);
        const fileContent = fs.readFileSync(filePath);

        // Build DOM from file content
        sendMessage(`Loading ${path.basename(filePath)}...`);
        const $ = cheerio.load(fileContent);

        // Query for all messages within the DOM
        messageCount = $(MESSAGE_QUERY_STRING).length;
        sendMessage(`Found ${messageCount} messages.`);

        $(MESSAGE_QUERY_STRING).each((index, element) => {
            if (index % 100 === 0 || index === messageCount - 1) {
                process.send(new ProgressUpdate(index, messageCount - 1));
            }

            if ($(element).find(MESSAGE_CONTENT_QUERY_STRING).text().includes('Duration')) {
                foundMessages ++;
            } else {
                $(element).remove();
            }
        });
        sendMessage(`Found ${foundMessages} call messages`);

        // Write filter data to file.
        const outFileName = filePath.replace(path.basename(filePath), saveFileName);
        fs.writeFileSync(outFileName, $.html());
        sendMessage(`Write Data to ${outFileName}`);
    } catch (error) {
        sendMessage(error.message);
    }
}

function messagesSummary(filePath: string, summaryType: string, saveFileName: string) {
    console.log(filePath);
    let messageCount = 0;
    let messageStat: MessageStatistic = {};

    try {
        // Read file content
        sendMessage(`Start processing ${path.basename(filePath)}...`);
        const fileContent = fs.readFileSync(filePath);

        // Build DOM from file content
        sendMessage(`Loading ${path.basename(filePath)}...`);
        const $ = cheerio.load(fileContent);

        // Query for all messages within the DOM
        messageCount = $(MESSAGE_QUERY_STRING).length;
        sendMessage(`Found ${messageCount} messages.`);

        $(MESSAGE_QUERY_STRING).each((index, element) => {
            if (index % 100 === 0 || index === messageCount - 1) {
                process.send(new ProgressUpdate(index, messageCount - 1));
            }

            const timesStamp = $(element).find(MESSAGE_TIMESTAMP_QUERY_STRING).text();

            const keyCount = Object.keys(messageStat).length;
            messageStat = gatherMessageStatistic(messageStat, element, timesStamp, summaryType);
            // check if key changes
            if (keyCount === Object.keys(messageStat).length) {
                $(element).remove();
            }
        });

        sendMessage(`Generated ${Object.keys(messageStat).length} messages groups.`);

        for (const timeVal in messageStat) {
            if (messageStat.hasOwnProperty(timeVal)) {
                const stat: Statistic = messageStat[timeVal];

                const blockTitle = `From ${stat.startTime.format(TIMESTAMP_FORMAT)} to ${stat.endTime.format(TIMESTAMP_FORMAT)}`;
                $(stat.element).find(MESSAGE_TITLE_QUERY_STRING).text(blockTitle);

                const blockContent = `Total messages count: ${stat.messageCount}`; 
                $(stat.element).find(MESSAGE_CONTENT_QUERY_STRING).text(blockContent);
                $(stat.element).find(MESSAGE_TIMESTAMP_QUERY_STRING).remove();
            }
        }

        // Write filter data to file.
        const outFileName = filePath.replace(path.basename(filePath), saveFileName);
        fs.writeFileSync(outFileName, $.html());
        sendMessage(`Write Data to ${outFileName}`);
    } catch (error) {
        sendMessage(error.message);
    }
}


function gatherMessageStatistic(messageStat: MessageStatistic, element, currentTimeStamp: string, summaryType: string): MessageStatistic {
    let startTime: moment.Moment
    let endTime: moment.Moment

    // Load current time stamp value
    const timestamp: moment.Moment = moment(currentTimeStamp.trim(), [TIMESTAMP_FORMAT]);

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
    if (timestamp.isSame(startTime) || timestamp.isBetween(startTime, endTime)) {
        if (!messageStat.hasOwnProperty(startTime.toString())) {
            messageStat[startTime.toString()] = new Statistic();
            messageStat[startTime.toString()].element = element;
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
    return messageStat;
}