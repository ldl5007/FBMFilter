const {ipcRenderer} = require('electron');

$(document).ready(function(){
  console.log('ready');

  $('#open-second-window').on('click', function(){
    console.log('open a second window');
    ipcRenderer.send('open-second-window');
  });
});