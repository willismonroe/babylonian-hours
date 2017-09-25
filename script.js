let locationData = {
    latitude: '',
    longitude: '',
}

let riseSet = {
    sunrise: '',
    sunset: '',
}

let babylonianDay = {
    lengthOfDayHour: '',
    numberOfSecondsinDay: '',
    dayHours: [],
    nightHours: [],

}


// Convert time storage over to minutes
function toMinutes(hours, minutes) {
    mins = hours * 60 + minutes;
    return mins;
}

function getGeoIp() {
    let url = 'http://freegeoip.net/json/'
    fetch(url)
        .then(
            function(response) {
                if (response.status !== 200) {
                    console.log("Looks like there was a problem: " + response.status);
                    return;
                }
                //console.log(response);
                response.json().then(function(data) {
                    //console.log(data);
                    locationData.latitude = data.latitude;
                    locationData.longitude = data.longitude;
                    console.log("Data for: " + data.city + ", " + data.country_name);

                    getSunriseSunset();
                });
            }
        )
        .catch(function(err) {
            console.log('Location Fetch Error', err);
        });

}

function getSunriseSunset() {
    let url = 'https://api.sunrise-sunset.org/json';
    url = url + '?lat=' + locationData.latitude;
    url = url + '&lng=' + locationData.longitude;
    url = url + '&formatted=0';
    fetch(url)
        .then(
            function(response) {
                if (response.status !== 200) {
                    console.log("Looks like there was a problem: " + response.status);
                    return;
                }
                //console.log(response);
                response.json().then(function(data) {
                    //console.log(data);
                    riseSet.sunrise = new Date(data.results.sunrise);
                    riseSet.sunset = new Date(data.results.sunset);
                    console.log("Sunrise: " + riseSet.sunrise);
                    console.log("Sunset: " + riseSet.sunset);

                    computeBabylonianTime();
                });
            }
        )
        .catch(function(err) {
            console.log('Sunrise/Sunset Fetch Error', err);
        });
}

function computeBabylonianTime() {
    babylonianDay.lDay = (riseSet.sunset - riseSet.sunrise);
    // Length of night is just number of milliseconds in a day minus length of daylight
    babylonianDay.lNight = 1000 * 60 * 60 * 24 - babylonianDay.lDay;
    babylonianDay.lDayHour = babylonianDay.lDay / 12;
    babylonianDay.lNightHour = babylonianDay.lNight / 12;
    hour = riseSet.sunrise;
    for (var i = 0; i < 12; i++) {
        hour = new Date(hour.getTime() + babylonianDay.lDayHour);
        if (i < 6) {
            part = 'after sunrise';
        } else {
            part = 'before sunset';
        }
        babylonianDay.dayHours[i] = {
            realtime: hour,
            hour: hour.getHours(),
            minutes: hour.getMinutes(),
            name: i.toString(),
            ush: Math.floor(babylonianDay.lDayHour / 240000),
            gar: Math.floor(babylonianDay.lDayHour / 240000) * 60,
            part: part,
        };
    };
    hour = riseSet.sunset;
    for (var i = 0; i < 12; i++) {
        hour = new Date(hour.getTime() + babylonianDay.lNightHour);
        if (i < 6) {
            part = 'after sunset';
        } else {
            part = 'before sunrise';
        }
        babylonianDay.nightHours[i] = {
            realtime: hour,
            hour: hour.getHours(),
            minutes: hour.getMinutes(),
            name: i.toString(),
            ush: Math.floor(babylonianDay.lNightHour / 240000),
            gar: Math.floor(babylonianDay.lNightHour / 240000) * 60,
            part: part,
        };
    };

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
            // Get 'now'
            d = new Date();

            // We need to find out if it's day or night
            if (riseSet.sunrise - d < 0 && riseSet.sunset - d > 0) {
                daytime = true;
                // Now we need to find the hour we're in
                for (var i = 0; i < babylonianDay.dayHours.length; i++) {
                    if (d - babylonianDay.dayHours[i].realtime < babylonianDay.lDayHour) {
                        part = babylonianDay.dayHours[i].part;
                        ush = Math.floor((d - babylonianDay.dayHours[i].realtime) / (babylonianDay.lDayHour / babylonianDay.dayHours[i].ush));
                        // (new Date() - (babylonianDay.dayHours[3].realtime.getTime() + Math.floor(ush * (babylonianDay.lDayHour / babylonianDay.dayHours[3].ush)))) / 4271
                        gar = Math.floor((d - (babylonianDay.dayHours[i].realtime.getTime() + Math.floor(ush * babylonianDay.lDayHour / babylonianDay.dayHours[i].ush))) / (babylonianDay.lDayHour / babylonianDay.dayHours[i].gar))
                        hour = i;
                        break;
                    }
                }

            } else {
                daytime = false;

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
            document.getElementById("hour").innerHTML = hour;
            document.getElementById("ush").innerHTML = ush;
            document.getElementById("gar").innerHTML = gar;
            document.getElementById("part").innerHTML = part;

        }, 500);

    }
    // Easier solution just figure out what the Bab-time is now... then figure out what the interval should
    // be and set it to that, and then do normal clock logic and forget checking any built-in table.