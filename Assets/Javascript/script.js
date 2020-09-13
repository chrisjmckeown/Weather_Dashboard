$(document).ready(function () {

    // OpenWeatherMap API key
    var OpenWeatherMapAPIKey = "53b3da334ab80c9261f53586ac885ee0"; //53b3da334ab80c9261f53586ac885ee0 //166a433c57516f51dfab1f7edaed8413
    // ipinfo API key
    var ipinfoAPIKey = "f2357f3657a5f4";
    // search list and default variables
    var recentSearchList = [];
    var defaultCity = "Auckland, NZ"; // set Auckland, NZ as default incase ipinfo.io access is not granted

    getDefaultCityCountry();

    // use ipinfo to source the local city and country
    function getDefaultCityCountry() {
        // Create an AJAX call to retrieve data Log the data in console
        var queryParameters = {
            token: ipinfoAPIKey,
        };
        var queryString = $.param(queryParameters);
        var queryURL = "https://ipinfo.io?" + queryString;
        // Call with a get method
        $.ajax({ url: queryURL, method: 'get' }).then(function (response) {
            defaultCity = response.city + ", " + response.country;
        }).catch(function (err) {
            console.log(err);
        }).always(function () {
            loadPage(); // this will run even if response fails
        });
    };

    // load/render the page
    function loadPage() {
        // get the stored search list
        getStoredSearchList();
        // if the list is empty then find the default city, else...
        if (recentSearchList.length === 0 || recentSearchList === null) {
            // display current weather
            getConditions(defaultCity);
        }
        else { // find the last city in the list, the last searched item
            // display current weather
            getConditions(recentSearchList[recentSearchList.length - 1]);
        }
    };

    // Get the List from local storage
    function getStoredSearchList() {
        var storedRecentSearchList = JSON.parse(localStorage.getItem("recentSearchList"));
        // check contents, if not null set to variable to list else if null to empty
        if (storedRecentSearchList !== null) {
            recentSearchList = storedRecentSearchList;
        }
    }

    // Set the List from local storage
    function setStoredSearchList(city) {
        // see if an existing entry exists
        var foundCity = recentSearchList.find(x => x === city);
        // if not found then create an new item, else...
        if (foundCity === undefined) {
            // Add new to the array, clear the input
            recentSearchList.push(city);
        }
        else { // move the found item in the array
            // move the to the top of the list
            array_move(recentSearchList, recentSearchList.findIndex(x => x === city), recentSearchList.length - 1);
        }
        // save the local storage with new items
        localStorage.setItem("recentSearchList", JSON.stringify(recentSearchList));
    }

    // display the search list, called after setStoredSearchList
    function renderSearchList() {
        $("#recent-search-list").empty();
        recentSearchList.forEach(function (city) {
            var $cityItem = $("<li>");
            $cityItem.addClass("list-group-item clickme");
            $cityItem.attr("id", "recent-searched-item");
            $cityItem.text(city);
            $("#recent-search-list").prepend($cityItem);
        });
    };

    // function to reorder the array
    function array_move(arr, old_index, new_index) {
        if (new_index >= arr.length) {
            var k = new_index - arr.length + 1;
            while (k--) {
                arr.push(undefined);
            }
        }
        arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    };

    // Update the today variable to the selected date and load the page
    $(document.body).on('click', "#recent-searched-item", function (event) {
        event.preventDefault();
        // display current weather
        getConditions(this.textContent);
    });

    // Get the city input and call function to find the city
    $("#select-city-btn").on("click", function (event) {
        event.preventDefault();
        var city = $("#city-input").val().trim();
        // display current weather
        getConditions(city);
    });

    // clear the search history and 
    $("#clear-city-btn").on("click", function (event) {
        event.preventDefault();
        // empty the search list and then add in a default city
        recentSearchList = [];
        // display current weather
        getConditions(defaultCity);
        // clear the input text
        $("#city-input").val("");
    });

    // ajax query to get the todays conditions
    function getConditions(city) {
        // Create an AJAX call to retrieve data
        var queryParameters = {
            q: city,
            units: "metric",
            appid: OpenWeatherMapAPIKey,
        };
        var queryString = $.param(queryParameters);
        // Call weather with City name to get the lat and lon
        var queryURL = "https://api.openweathermap.org/data/2.5/weather?" + queryString;
        // Call with a get method
        $.ajax({ url: queryURL, method: 'get' }).then(function (response) {
            // if successfull then store the result
            setStoredSearchList(response.name + ", " + response.sys.country);
            // Populate the city and Country (with out the country it is hard to know which country the city is in)
            $("#city").text(response.name + " (" + response.sys.country + ")");
            //render the search list with recent search item at the top
            renderSearchList();
            // get the 7 day forecast based on the lon and lat. 7 day forecast only works works with lon and lat.
            getSevenDayForecast(response.coord.lon, response.coord.lat);
            // clear the input text
            $("#city-input").val("");

            initialize(response.coord.lon, response.coord.lat);
        }).catch(function (err) {
            console.log(err);
        });
    };

    // ajax query to get the five day forecast
    function getSevenDayForecast(lon, lat) {
        // Create an AJAX call to retrieve data Log the data in console
        var queryParameters = {
            lat: lat,
            lon: lon,
            exclude: "minutely,hourly",
            units: "metric",
            appid: OpenWeatherMapAPIKey,
        };
        var queryString = $.param(queryParameters);
        var queryURL = "https://api.openweathermap.org/data/2.5/onecall?" + queryString;
        // Call with a get method
        $.ajax({ url: queryURL, method: 'get' }).then(function (response) {
            // display todays current conditions
            renderTodaysConditions(response.current);
            // display the forcast
            getFiveDayForecast(response.daily)
        }).catch(function (err) {
            console.log(err);
        });
    };

    // display todays conditions
    function renderTodaysConditions(current) {
        // use moment to formate the date.
        var date = moment().format('DD/MM/YYYY');
        $("#date").text("(" + date + ")");
        // get the icon code and build the URL and add to the image.
        var iconCode = current.weather[0].icon;
        var iconurl = "https://openweathermap.org/img/w/" + iconCode + ".png";
        $("#weather-icon").attr("src", iconurl);
        // apply the other properties
        $("#temp").text(current.temp + ' ℃');
        $("#humidity").text(current.humidity + ' %');
        $("#wind").text(current.wind_speed + " km/h");
        renderUV(current.uvi);
    }

    // Loop through an array, extracting the day
    function getFiveDayForecast(list) {
        // reset the div containing the 5 day forcast
        $("#five-day-forecast").empty();
        // iterate over list, starting at 2 (missing today), and finishing at 5th day
        for (i = 1; i < 6; i++) {
            renderDay(list[i]);
        }
    };

    // display each day conditions
    function renderDay(item) {
        // create a div to append all the data too
        var $day = $("<div>");
        // gather the data into variables
        var dayDate = moment.unix(item.dt).format('DD/MM/YYYY');
        var dayIconCode = item.weather[0].icon;
        var dayIconurl = "https://openweathermap.org/img/w/" + dayIconCode + ".png";
        var dayTemp = item.temp.max;
        var dayHumidity = item.humidity;
        $day.addClass("list-group-item active")
        // append the gathered data to the div
        $day.append('<h5>' + dayDate + '</h5>');
        $day.append('<img src="' + dayIconurl + '" alt="Weather Image"></img>');
        $day.append('<p>Temp: ' + dayTemp + ' &#8451;</p>');
        $day.append('<p>Humidity: ' + dayHumidity + ' &#x25;</p>');
        // prepend the day to the five day forecast id
        $("#five-day-forecast").append($day);
    };

    // color code the UV conditions
    function renderUV(index) {
        // based on the index range, set an attribute call index this will be used in css to color the background
        $("#uv-index").text(index);
        if (index < 3) {
            $("#uv-index").attr("index", "green");
        }
        else if (index < 6) {
            $("#uv-index").attr("index", "yellow");
        }
        else if (index < 8) {
            $("#uv-index").attr("index", "orange");
        }
        else if (index < 11) {
            $("#uv-index").attr("index", "red");
        }
        else {
            $("#uv-index").attr("index", "violet");
        }
    };

//#region code from here: https://github.com/google/maps-for-work-samples/tree/master/samples/maps/OpenWeatherMapLayer
    var map;
    var geoJSON;
    var request;
    var gettingData = false;

    function initialize(lon,lat) {
        var mapOptions = {
            zoom: 10,
            center: new google.maps.LatLng(lat, lon)
        };

        map = new google.maps.Map(document.getElementById('google-map'),
            mapOptions);
        // Add interaction listeners to make weather requests
        google.maps.event.addListener(map, 'idle', checkIfDataRequested);

        // Sets up and populates the info window with details
        map.data.addListener('click', function (event) {
            infowindow.setContent(
                "<img src=" + event.feature.getProperty("icon") + ">"
                + "<br /><strong>" + event.feature.getProperty("city") + "</strong>"
                + "<br />" + event.feature.getProperty("temperature") + "&deg;C"
                + "<br />" + event.feature.getProperty("weather")
            );
            infowindow.setOptions({
                position: {
                    lat: event.latLng.lat(),
                    lng: event.latLng.lng()
                },
                pixelOffset: {
                    width: 0,
                    height: -15
                }
            });
            infowindow.open(map);
        });
    }

    var checkIfDataRequested = function () {
        // Stop extra requests being sent
        while (gettingData === true) {
            request.abort();
            gettingData = false;
        }
        getCoords();
    };

    // Get the coordinates from the Map bounds
    var getCoords = function () {
        var bounds = map.getBounds();
        var NE = bounds.getNorthEast();
        var SW = bounds.getSouthWest();
        getWeather(NE.lat(), NE.lng(), SW.lat(), SW.lng());
    };

    // Make the weather request
    var getWeather = function (northLat, eastLng, southLat, westLng) {
        gettingData = true;
        var requestString = "http://api.openweathermap.org/data/2.5/box/city?bbox="
            + westLng + "," + northLat + "," //left top
            + eastLng + "," + southLat + "," //right bottom
            + map.getZoom()
            + "&cluster=yes&format=json"
            + "&APPID=" + OpenWeatherMapAPIKey;
        request = new XMLHttpRequest();
        request.onload = proccessResults;
        request.open("get", requestString, true);
        request.send();
    };

    // Take the JSON results and proccess them
    var proccessResults = function () {
        var results = JSON.parse(this.responseText);
        if (results.list.length > 0) {
            resetData();
            for (var i = 0; i < results.list.length; i++) {
                geoJSON.features.push(jsonToGeoJson(results.list[i]));
            }
            drawIcons(geoJSON);
        }
    };

    var infowindow = new google.maps.InfoWindow();

    // For each result that comes back, convert the data to geoJSON
    var jsonToGeoJson = function (weatherItem) {
        var feature = {
            type: "Feature",
            properties: {
                city: weatherItem.name,
                weather: weatherItem.weather[0].main,
                temperature: weatherItem.main.temp,
                min: weatherItem.main.temp_min,
                max: weatherItem.main.temp_max,
                humidity: weatherItem.main.humidity,
                pressure: weatherItem.main.pressure,
                windSpeed: weatherItem.wind.speed,
                windDegrees: weatherItem.wind.deg,
                windGust: weatherItem.wind.gust,
                icon: "http://openweathermap.org/img/w/"
                    + weatherItem.weather[0].icon + ".png",
                coordinates: [weatherItem.coord.Lon, weatherItem.coord.Lat]
            },
            geometry: {
                type: "Point",
                coordinates: [weatherItem.coord.Lon, weatherItem.coord.Lat]
            }
        };
        // Set the custom marker icon
        map.data.setStyle(function (feature) {
            return {
                icon: {
                    url: feature.getProperty('icon'),
                    anchor: new google.maps.Point(25, 25)
                }
            };
        });

        // returns object
        return feature;
    };

    // Add the markers to the map
    var drawIcons = function (weather) {
        map.data.addGeoJson(geoJSON);
        // Set the flag to finished
        gettingData = false;
    };

    // Clear data layer and geoJSON
    var resetData = function () {
        geoJSON = {
            type: "FeatureCollection",
            features: []
        };
        map.data.forEach(function (feature) {
            map.data.remove(feature);
        });
    };
//#endregion
});