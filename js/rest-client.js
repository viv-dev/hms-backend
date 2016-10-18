/*-------------------------------------------------------------------
*************************REST-CLIENT*******************************
Description:    Javascript and JQuery functions for interacting with
                the Mystic Server REST API in order to query and modify
                sensor information.
Author:         Viviana Capote
Last Updated:   18/10/2016
-------------------------------------------------------------------*/

var apiURL = "https://hmps.localtunnel.me/api";

//Takes in a sensor data and divclass name and generates a string with HTML code to inject into the page
buildSensorHTML = function(data)
    {
        var html = '<tr>';
        html += '<td>' + data['UUID'] + '</td>';
        html += '<td>' + data['roomID'] + '</td>';
        html += '<td>' + data['roomName'] + '</td>';
        html += '<td>';
        html += '<form class=\"edit-' + data['_id'] + '\">';
        //html += '<form class=\"loginterval-' + data['_id'] + '\">';
        html += "<select name=\"logInterval\">";
        html += '<option ' + ((data['logInterval'] == 5000) ? 'selected' : '') + ' value=\"5000\">5s</option>';
        html += '<option ' + ((data['logInterval'] == 10000) ? 'selected' : '') + ' value=\"10000\">10s</option>';
        html += '<option ' + ((data['logInterval'] == 20000) ? 'selected' : '') + ' alue=\"20000\">20s</option>';
        html += '<option ' + ((data['logInterval'] == 30000) ? 'selected' : '') + ' value=\"30000\">30s</option>';
        html += '<option ' + ((data['logInterval'] == 60000) ? 'selected' : '') + ' value=\"60000\">1min</option>';
        html += '<option ' + ((data['logInterval'] == 300000) ? 'selected' : '') + ' value=\"300000\">5min</option>';
        html += '<option ' + ((data['logInterval'] == 600000) ? 'selected' : '') + ' value=\"600000\">10min</option>';
        html += '</select>';
        html += '</form>';
        html += '</td>';
        html += '<td>';
        html += '<form class=\"edit-' + data['_id'] + '\">';
        //html += '<form class=\"loggingenabled-' + data['_id'] + '\">';
        html += '<select name=\"loggingEnabled\">';
        html += '<option ' + ((data['loggingEnabled'] == "false") ? 'selected' : '') + ' value=\"false\">No</option>';
        html += '<option ' + ((data['loggingEnabled'] == "true") ? 'selected' : '') + ' value=\"true\">Yes</option>';
        html += '</select>'
        html += '</form>';
        html += '</td>';
        html += '<td>'
        html += '<button class="btn btn-outline btn-circle btn-sm purple" onClick="updateSensor(\'' + data['_id'] + '\')"> <i class="fa fa-edit"></i> Update </button>';
        html += '<button class="btn btn-outline btn-circle dark btn-sm black" onClick="deleteSensor(\'' + data['_id'] + '\')"><i class="fa fa-edit"></i> Delete </button>';
        return html += '</tr>';

    }

/*CRUD Functions (Create, Retrieve, Update, Delete) */
//Use POST request to add new sensor with info from form
createSensor = function()
    {
        $.ajax(
        {
            url: apiURL + '/sensors/',
            type: 'POST',
            data: $('.form-addsensor').serialize(),
            success: function()
            {
                location.reload();
            }
        });
    }

//Retrieve a JSON with all sensor configurations
retreiveSensors = function()
    {
        $.ajax(
        {
            type: "GET",
            url: apiURL + '/sensors/'
        }).then(function(data)
        {
            console.log(JSON.stringify(data));
            for (var i = 0; i < data.length; i++)
            {
                $('.sensor-rows').append(buildSensorHTML(data[i]));
            }
        });
    }

//Update sensor based on specific sensor ID
updateSensor = function(sensorID)
    {
        console.log("Updating sensor with id: " + sensorID);
        $.ajax(
        {
            type: "PUT",
            url: apiURL + '/sensors/' + sensorID,
            data: $('.edit-' + sensorID).serialize(),
            //data: $('.loginterval-' + sensorID).serialize() + $('.loggingenabled-' + sensorID).serialize(),
            success: function(result)
            {
                if (!result)
                    console.log("Update failed!");
                else
                    console.log("Update success!");

                location.reload();
            }
        });
    }

//Call REST API delete request for a specific sensor ID
deleteSensor = function(sensorID)
    {
        console.log("Deleting sensor with id: " + sensorID);
        $.ajax(
        {
            type: "DELETE",
            url: apiURL + '/sensors/' + sensorID,
            success: function(result)
            {
                if (!result)
                    console.log("Delete failed!");
                else
                    console.log("Delete success!");
            }
        });
        location.reload();
    }
    