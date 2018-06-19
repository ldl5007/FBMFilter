import * as fs from "fs";
import * as path from "path";
import { JSDOM } from "jsdom";

const MESSAGE_QUERY_STRING = '.pam._3-95._2pi0._2lej.uiBoxWhite.noborder';

process.on("message", (filePath) => {
    console.log(filePath);
    let foundMessages = 0;

    const fileContent = fs.readFileSync(filePath);
    process.send(`Start process ${path.basename(filePath)}`);
    const dom = new JSDOM(fileContent);
    const messages = dom.window.document.querySelectorAll(MESSAGE_QUERY_STRING);
    process.send(`${messages.length} messages found`);

    for (let index = 0; index < messages.length; index ++) {
      const message = messages[index];

      if (index % 100 === 0){
        process.send(`${index}/${messages.length}`);
      }
      
      if (!message.textContent.includes('Duration')){
        message.parentElement.removeChild(message);
      }
      else {
        foundMessages ++;
        console.log(index);
      }

    }
    
    process.send(`Found ${foundMessages} messages`);

    const outFileName = 'dummyFile.html';
    fs.writeFileSync(outFileName, dom.window.document.documentElement.outerHTML);
    process.send(`Write Data to ${outFileName}`);

    process.send("end process");
});
