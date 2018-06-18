const {ipcRenderer} = require('electron');

$(document).ready(function(){
  console.log('ready');

  $('#browse-button').on('click', function(){
      console.log('browse-button');
      ipcRenderer.send('browse-button');
  });

  $('#filter-button').on('click', function(){
    console.log('filter-button');
    ipcRenderer.send('filter-button', $("#selected-file").val());
  });

  ipcRenderer.on('set-seleted-file', function(event, arg){
    console.log('set selected file to ' + arg);
    $("#selected-file").val(arg);
  });

  ipcRenderer.on('log-message', function(event, message){
    console.log('log-message: ' + message);
    const logText = $('#log-area').text() + message + '\n';
    $('#log-area').text(logText)
  });
});