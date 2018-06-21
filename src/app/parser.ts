import * as fs from "fs";
import * as path from "path";
import { JSDOM } from "jsdom";
import { LogMessage, ProgressUpdate } from "../app/interfaces/thread-message.interface";

const MESSAGE_QUERY_STRING = '.pam._3-95._2pi0._2lej.uiBoxWhite.noborder';

process.on("message", (filePath: string) => {
    console.log(filePath);
    let foundMessages = 0;

    sendMessage(`Start processing ${path.basename(filePath)}...`);
    const fileContent = fs.readFileSync(filePath);
    
    sendMessage(`Loading ${path.basename(filePath)}...`);
    const dom = new JSDOM(fileContent);

    sendMessage('Searching for messages...');
    const messages = dom.window.document.querySelectorAll(MESSAGE_QUERY_STRING);
    sendMessage(`Found ${messages.length} messages.`);

    sendMessage('Filtering for call messages...')
    for (let index = 0; index < messages.length; index ++) {
      const message = messages[index];

      if (index % 100 === 0){
        process.send(new ProgressUpdate(index, messages.length));
      }
      
      if (!message.textContent.includes('Duration')){
        message.parentElement.removeChild(message);
      }
      else {
        foundMessages ++;
      }
    }
  
    sendMessage(`Found ${foundMessages} call messages`);

    const outFileName = filePath.replace(path.basename(filePath), 'CallLog.html');;
    fs.writeFileSync(outFileName, dom.window.document.documentElement.outerHTML);
    sendMessage(`Write Data to ${outFileName}`);
});

function sendMessage(message: string) {
  process.send(new LogMessage(message));
}