import * as fs from "fs";
import * as path from "path";
import * as moment from "moment";
import { JSDOM } from "jsdom";
import { LogMessage, ProgressUpdate } from "../app/interfaces/thread-message.interface";

const MESSAGE_QUERY_STRING = '.pam._3-95._2pi0._2lej.uiBoxWhite.noborder';
const MESSAGE_TITLE_QUERY_STRING = '._3-96._2pio._2lek._2lel';
const MESSAGE_CONTENT_QUERY_STRING = '._3-96._2let';
const MESSAGE_TIMESTAMP_QUERY_STRING = '._3-94._2lem';

const TIMESTAMP_FORMAT= 'MMM DD, YYY hh:mmA';

class ParsedMessage {
  public element: Element;
  public title: string;
  public content: string;
  public timestamp: string;
}

class MessageStat {
  public range: string;
  public messageCount: number;
}

process.on("message", (filePath: string) => {
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
    for (let index = 0; index < messages.length; index ++) {
      const message = messages[index];

      if (index % 100 === 0){
        process.send(new ProgressUpdate(index, messages.length));
      }
      
      const parsedMessage = new ParsedMessage();
      parsedMessage.element = message;

      const titleElement = message.querySelector(MESSAGE_TITLE_QUERY_STRING);
      const contentElement = message.querySelector(MESSAGE_CONTENT_QUERY_STRING);
      const timestampElement = message.querySelector(MESSAGE_TIMESTAMP_QUERY_STRING);

      if (titleElement && contentElement && timestampElement){
        parsedMessage.title = titleElement.textContent;
        parsedMessage.content = contentElement.textContent;
        parsedMessage.timestamp = timestampElement.textContent;
        parsedMessages.push(parsedMessage);   
      }
    }
    sendMessage('Extracting messages informations completed');
    sendMessage(`Found ${parsedMessages.length} messages.`);

    gatherMessageStatistic(parsedMessages);

    sendMessage('Filtering for call messages...');
    parsedMessages.forEach((message: ParsedMessage, index: number) => {
      if (index % 100 === 0){
        process.send(new ProgressUpdate(index, parsedMessages.length));
      }

      if (!message.content.includes('Duration')){
        message.element.parentElement.removeChild(message.element);
      }
      else {
        foundMessages ++;
      }
    });
    sendMessage('Filtering for call messages completed');
    sendMessage(`Found ${foundMessages} call messages`);

    // Write filter data to file.
    const outFileName = filePath.replace(path.basename(filePath), 'CallLog.html');;
    fs.writeFileSync(outFileName, dom.window.document.documentElement.outerHTML);
    sendMessage(`Write Data to ${outFileName}`);
  } catch (error) {
    sendMessage(error.message);
  }
});

function sendMessage(message: string) {
  process.send(new LogMessage(message));
}

function gatherMessageStatistic(parsedMessages: ParsedMessage[]): any {
  parsedMessages.forEach((message: ParsedMessage, index: number) => {
    console.log(message.timestamp);
    const time:moment.Moment = moment(message.timestamp.trim(), [TIMESTAMP_FORMAT]);
    console.log(time);
  });
}