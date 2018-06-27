const {ipcRenderer} = require('electron');

$(document).ready(function(){
  console.log('ready');

  $('#browse-button').on('click', function(){
      console.log('browse-button');
      $('#log-area').text('');
      ipcRenderer.send('browse-button');
  });

  $('#filter-button').on('click', function(){
    console.log('filter-button');
    let filterData = {
      selectedFile: $("#selected-file").val(),
      filterCalls: $("#filter-calls-checkbox:checked").val(),
      messagesSummary: $("#messages-summary-checkbox:checked").val()
    };
    ipcRenderer.send('filter-button', filterData);
  });

  $('#messages-summary-checkbox').on('click', () => {
    console.log('message-summary-checkbox clicked');

    if($("#messages-summary-checkbox:checked").val() === "on") {
      $('#messages-summary-select').attr("disabled", null);
    } else {
      $('#messages-summary-select').attr("disabled", "disabled");
    }
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

  ipcRenderer.on('set-progress', function(event, progressData){
    if (progressData.max) {
      $("#progress-bar").attr("max", progressData.max);
    }
    if (progressData.val) {
      $("#progress-bar").val(progressData.val);
    }
  });
});