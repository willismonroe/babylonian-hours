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
    numberOfSecondsInDay: "",
    dayHours: [],
    nightHours: []
};

let locationError = false;

function round(value, decimals) {
    "use strict";
    return Number(Math.round(value + "e" + decimals) + "e-" + decimals);
}

let rad = 180 / Math.PI;

function sin(angle) {
    return Math.sin(angle * rad);
}

function cos(angle) {
    return Math.cos(angle * rad);
}

function calculateSunriseSunset(lat, long) {
    console.log("Lat, long", lat, long);
    // Pulled from https://en.wikipedia.org/wiki/Sunrise_equation

    // Calculate current Julian Day
    J_date = Math.floor((new Date().getTime() / 86400000) + 2440587.5);
    n = J_date - 2451545.0 + 0.0008;

    // Mean solar noon
    J_star = n - long/360;

    // Solar mean anomaly
    M = (357.5291 + 0.98560028 * J_star) % 360;

    // Equation of the Center
    C = 1.9148*sin(M) + 0.0200*sin(2*M) + 0.0003*sin(3*M);

    // Ecliptic longitude
    L = (M + C + 180 + 102.9372) % 360;

    // Solar transit
    J_transit = 2451545 + J_star + 0.0053*sin(M) - 0.0069*sin(2*L);

    // Declination of the Sun
    δ = sin(sin(λ) * sin(23.44));

    // Hour angle
    w = cos((sin(-0.83) - sin(lat) * sin(δ)) / (cos(lat) * cos(δ)));

    // Calculate sunrise and sunset
    J_set = J_transit + (w / 360);
    J_rise = J_transit - (w / 360);
}

function getGeoIp() {
    "use strict";
    let url = "https://freegeoip.app/json/";
    fetch(url, {
        headers: {}
    })
        .then(
            function (response) {
                if (response.status !== 200) {
                    console.log("Looks like there was a problem: " + response.status);
                    return;
                }
                //console.log(response);
                response.json().then(function (data) {
                    console.log("Data for: " + data.city + ", " + data.country_name);
                    locationData.latitude = data.latitude;
                    locationData.longitude = data.longitude;

                    let d = new Date();
                    let date = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();

                    getSunriseSunset(locationData.latitude, locationData.longitude, date);
                });
            }
        )
        .catch(function (err) {
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
            function (response) {
                if (response.status !== 200) {
                    console.log("Looks like there was a problem: " + response.status);
                    return;
                }
                //console.log(response);
                response.json().then(function (data) {
                    //console.log(data);
                    let sunrise = data.results.sunrise;
                    let sunset = data.results.sunset;


                    riseSet.sunrise = new Date(data.results.sunrise);
                    riseSet.sunset = new Date(data.results.sunset);
                    console.log("Sunrise: " + riseSet.sunrise);
                    console.log("Sunset: " + riseSet.sunset);

                    computeBabylonianTime();
                });
            }
        )
        .catch(function (err) {
            console.log("Sunrise/Sunset Fetch Error", err);
        });
}

function computeBabylonianTime() {
    babylonianDay.lDay = (riseSet.sunset - riseSet.sunrise);
    // Length of night is just number of milliseconds in a day minus length of daylight
    babylonianDay.lNight = 1000 * 60 * 60 * 24 - babylonianDay.lDay;
    babylonianDay.lDayHour = babylonianDay.lDay / 12;
    babylonianDay.lNightHour = babylonianDay.lNight / 12;
    let hour = riseSet.sunrise;
    for (i = 0; i < 12; i++) {
        let part = "BST";
        if (i < 6) {
            part = "ASR";
        }
        babylonianDay.dayHours[i] = {
            realtime: hour,
            hour: hour.getHours(),
            minutes: hour.getMinutes(),
            name: i.toString(),
            // TODO: Move ush and gar up to babylonianDay, rather than in each hour
            ush: Math.floor(babylonianDay.lDayHour / 240000),
            gar: Math.floor(babylonianDay.lDayHour / 240000) * 60,
            part: part
        };
        hour = new Date(hour.getTime() + babylonianDay.lDayHour);
    }
    hour = riseSet.sunset;
    for (i = 0; i < 12; i++) {
        let part = "BSR";
        if (i < 6) {
            part = "AST";
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


window.onload = function () {
    let hour = "00";
    let ush = "00";
    let gar = "00";
    let part = "...";

    window.setInterval(function () {

        if (locationError === true) {
            document.getElementById("error").innerHTML = "Location Error: Disable your Adblocker";
            return;
        }

        // Get "now"
        let d = new Date();

        // Compute new times if we've reached the end of day or night


        // We need to find out if it"s day or night
        if (riseSet.sunrise - d < 0 && riseSet.sunset - d > 0) {
            let daytime = true;
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

};