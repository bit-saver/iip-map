// Set Screendoor API endpoint
export const setEndpoints = ( projectId, apiKey ) => {
  const screendoorEndpoint = `https://screendoor.dobt.co/api/projects/${projectId}`;
  const screendoorKey = `&v=0&api_key=${apiKey}`;

  return {
    formEndpoint: `${screendoorEndpoint}/form?${screendoorKey}`,
    statusEndpoint: `${screendoorEndpoint}/statuses?${screendoorKey}`
  };
};

// Identify button to get Screendoor data
// const getFieldsBtn = document.getElementById('iip-map-get-fields');
// getFieldsBtn.addEventListener('click', getScreendoorMeta);

// function getScreendoorMeta() {
//   getScreendoorFields();
//   getStatuses();
// }

// Get Screendoor field ids and labels
export const getScreendoorFields = ( projectId, apiKey ) => {
  const { formEndpoint } = setEndpoints( projectId, apiKey );

  // Make request to Screendoor API
  const formXHR = new XMLHttpRequest();
  formXHR.open( 'GET', formEndpoint );
  formXHR.responseType = 'json';
  formXHR.send();

  formXHR.onload = function setResponses() {
    const formData = formXHR.response;
    const formStatus = formXHR.statusText;

    console.log( formData, formStatus );

  //   populateScreendoorFields( formData.field_data );
  };
};

// Add Screedoor field ids as dropdown options
// function populateScreendoorFields(data) {
//   let screendoorFields = document.querySelectorAll('.map-admin-project-info-select');
//   let fieldOptions = [];

//   fieldOptions.push( "<option>- Select -</option>" );
//   data.forEach( function(item) {
//     fieldOptions.push( "<option id='" + item.id + "' value='" + item.id + "'>" + item.label + "</option>" );
//   });

//   let fieldOptionsList = fieldOptions.join('');

//   screendoorFields.forEach( function(item){
//     item.innerHTML += fieldOptionsList
//   });
// }

// Get Screendoor statuses
// function getStatuses() {
//   let statusEndpoint = screendoorEndpoint + '/statuses?' + screendoorKey;
//   // Make request to Screendoor API
//   let statusXHR = new XMLHttpRequest();
//   statusXHR.open('GET', statusEndpoint);
//   statusXHR.responseType = 'json';
//   statusXHR.send();

//   statusXHR.onload = function() {
//     let statusData = statusXHR.response;
//     let statusStatus = statusXHR.statusText

//     populateStatuses(statusData);
//   }
// }

// Add Screedoor statuses as dropdown options
// function populateStatuses(data) {
//   let triggerStatusSelect = document.getElementById('iip-map-geocoder-trigger');
//   let completeStatusSelect = document.getElementById('iip-map-geocoder-complete');
//   let statusOptions = [];

//    statusOptions.push( "<option>- Select -</option>" );
//    data.forEach( function(item) {
//       statusOptions.push( "<option id='" + item.name + "' value='" + item.name + "'>" + item.name + "</option>" );
//   });

//   let statusOptionsList = statusOptions.join('');
//   triggerStatusSelect.innerHTML += statusOptionsList;
//   completeStatusSelect.innerHTML += statusOptionsList;
// }