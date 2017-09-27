/*jslint es6 */

let locationData = {
    latitude: 0,
    longitude: 0
};

let riseSet = {
    sunrise: "",
    sunset: ""
};

let babylonianDay = {
    lengthOfDayHour: "",
    numberOfSecondsinDay: "",
    dayHours: [],
    nightHours: []
};

let locationError = false;

function round(value, decimals) {
    "use strict";
    return Number(Math.round(value + "e" + decimals) + "e-" + decimals);
}

function getGeoIp() {
    "use strict";
    let url = "https://freegeoip.net/json/";
    fetch(url, {
            headers: {}
        })
        .then(
            function(response) {
                if (response.status !== 200) {
                    console.log("Looks like there was a problem: " + response.status);
                    return;
                }
                //console.log(response);
                response.json().then(function(data) {
                    console.log("Data for: " + data.city + ", " + data.country_name);
                    locationData.latitude = data.latitude;
                    locationData.longitude = data.longitude;

                    let d = new Date();
                    let date = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();

                    getSunriseSunset(locationData.latitude, locationData.longitude, date);
                });
            }
        )
        .catch(function(err) {
            console.log("Location Fetch Error", err);
            locationError = true;
        });

}

function getSunriseSunset(lat, long, date) {
    let url = "https://api.sunrise-sunset.org/json";
    url = url + "?lat=" + lat; //locationData.latitude;
    url = url + "&lng=" + long; //locationData.longitude;
    url = url + "&date=" + date;
    url = url + "&formatted=0";
    fetch(url, {
            headers: {}
        })
        .then(
            function(response) {
                if (response.status !== 200) {
                    console.log("Looks like there was a problem: " + response.status);
                    return;
                }
                //console.log(response);
                response.json().then(function(data) {
                    //console.log(data);
                    sunrise = data.results.sunrise;
                    sunset = data.results.sunset;



                    riseSet.sunrise = new Date(data.results.sunrise);
                    riseSet.sunset = new Date(data.results.sunset);
                    console.log("Sunrise: " + riseSet.sunrise);
                    console.log("Sunset: " + riseSet.sunset);

                    computeBabylonianTime();
                });
            }
        )
        .catch(function(err) {
            console.log("Sunrise/Sunset Fetch Error", err);
        });
}

function computeBabylonianTime() {
    babylonianDay.lDay = (riseSet.sunset - riseSet.sunrise);
    // Length of night is just number of milliseconds in a day minus length of daylight
    babylonianDay.lNight = 1000 * 60 * 60 * 24 - babylonianDay.lDay;
    babylonianDay.lDayHour = babylonianDay.lDay / 12;
    babylonianDay.lNightHour = babylonianDay.lNight / 12;
    hour = riseSet.sunrise;
    for (i = 0; i < 12; i++) {
        if (i < 6) {
            part = "ASR";
        } else {
            part = "BST";
        }
        babylonianDay.dayHours[i] = {
            realtime: hour,
            hour: hour.getHours(),
            minutes: hour.getMinutes(),
            name: i.toString(),
            ush: Math.floor(babylonianDay.lDayHour / 240000),
            gar: Math.floor(babylonianDay.lDayHour / 240000) * 60,
            part: part
        };
        hour = new Date(hour.getTime() + babylonianDay.lDayHour);
    }
    hour = riseSet.sunset;
    for (i = 0; i < 12; i++) {
        if (i < 6) {
            part = "AST";
        } else {
            part = "BSR";
        }
        babylonianDay.nightHours[i] = {
            realtime: hour,
            hour: hour.getHours(),
            minutes: hour.getMinutes(),
            name: i.toString(),
            ush: Math.floor(babylonianDay.lNightHour / 240000),
            gar: Math.floor(babylonianDay.lNightHour / 240000) * 60,
            part: part
        };
        hour = new Date(hour.getTime() + babylonianDay.lNightHour);
    }

    document.getElementById("lDayHour").innerHTML = round(babylonianDay.lDayHour / 60000, 2);
    document.getElementById("lNightHour").innerHTML = round(babylonianDay.lNightHour / 60000, 2);
    document.getElementById("numberOfUsh").innerHTML = babylonianDay.dayHours[0].ush;
    document.getElementById("numberOfUsh2").innerHTML = babylonianDay.dayHours[0].ush;
    document.getElementById("numberOfUsh3").innerHTML = babylonianDay.dayHours[0].ush;

    console.log("Done setting up!");
}

function setup() {
    getGeoIp();
}

setup();


window.onload = function() {
    hour = "00";
    ush = "00";
    gar = "00";
    part = "...";

    window.setInterval(function() {

        if (locationError == true) {
            document.getElementById("error").innerHTML = "Location Error: Disable your Adblocker";
            return;
        }

        // Get "now"
        d = new Date();

        // Compute new times if we've reached the end of day or night



        // We need to find out if it"s day or night
        if (riseSet.sunrise - d < 0 && riseSet.sunset - d > 0) {
            daytime = true;
            // Now we need to find the hour we"re in
            for (i = 0; i < babylonianDay.dayHours.length; i++) {
                if (d - babylonianDay.dayHours[i].realtime < babylonianDay.lDayHour) {
                    part = babylonianDay.dayHours[i].part;
                    ush = Math.floor((d - babylonianDay.dayHours[i].realtime) / (babylonianDay.lDayHour / babylonianDay.dayHours[i].ush));
                    gar = Math.floor((d - (babylonianDay.dayHours[i].realtime.getTime() + Math.floor(ush * babylonianDay.lDayHour / babylonianDay.dayHours[i].ush))) / (babylonianDay.lDayHour / babylonianDay.dayHours[i].gar))
                    hour = i;



                    if (hour < 10) {
                        hour = "0" + hour.toString();
                    }
                    if (ush < 10) {
                        ush = "0" + ush.toString();
                    }
                    if (gar < 10) {
                        gar = "0" + gar.toString();
                    }
                    break;
                }
            }

        } else {
            daytime = false;
            // Now we need to find the hour we"re in
            for (i = 0; i < babylonianDay.nightHours.length; i++) {
                if (d - babylonianDay.nightHours[i].realtime < babylonianDay.lNightHour) {
                    part = babylonianDay.nightHours[i].part;
                    ush = Math.floor((d - babylonianDay.nightHours[i].realtime) / (babylonianDay.lNightHour / babylonianDay.nightHours[i].ush));
                    // (new Date() - (babylonianDay.dayHours[3].realtime.getTime() + Math.floor(ush * (babylonianDay.lDayHour / babylonianDay.dayHours[3].ush)))) / 4271
                    gar = Math.floor((d - (babylonianDay.nightHours[i].realtime.getTime() + Math.floor(ush * babylonianDay.lNightHour / babylonianDay.nightHours[i].ush))) / (babylonianDay.lNightHour / babylonianDay.nightHours[i].gar))
                    hour = i;


                    // Check if we're past midnight and have a negative ush

                    if (ush < 0) {
                        console.log("Need to grab yesterday's sunset information.");
                        getSunriseSunset(locationData.latitude, locationData.longitude, "yesterday")
                    }

                    if (hour < 10) {
                        hour = "0" + hour.toString();
                    }
                    if (ush < 10) {
                        ush = "0" + ush.toString();
                    }
                    if (gar < 10) {
                        gar = "0" + gar.toString();
                    }
                    break;
                }
            }

        }
        document.getElementById("hour").innerHTML = hour;
        document.getElementById("ush").innerHTML = ush;
        document.getElementById("gar").innerHTML = gar;
        document.getElementById("part").innerHTML = part;
    }, 500);

}