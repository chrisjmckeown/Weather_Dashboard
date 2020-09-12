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
            getTodaysConditions(defaultCity);
            // display the 5 day forecast
            getFiveDayForecast(defaultCity);
        }
        else { // find the last city in the list, the last searched item
            // display current weather
            getTodaysConditions(recentSearchList[recentSearchList.length - 1]);
            // display the 5 day forecast
            getFiveDayForecast(recentSearchList[recentSearchList.length - 1]);
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
        getTodaysConditions(this.textContent);
        // display the 5 day forecast
        getFiveDayForecast(this.textContent);
    });

    // Get the city input and call function to find the city
    $("#select-city-btn").on("click", function (event) {
        event.preventDefault();
        var city = $("#city-input").val().trim();
        // display current weather
        getTodaysConditions(city);
        // display the 5 day forecast
        getFiveDayForecast(city);
    });

    // clear the search history and 
    $("#clear-city-btn").on("click", function (event) {
        event.preventDefault();
        // empty the search list and then add in a default city
        recentSearchList = [];
        // display current weather
        getTodaysConditions(defaultCity);
        // display the 5 day forecast
        getFiveDayForecast(defaultCity);
        // clear the input text
        $("#city-input").val("");
    });

    // ajax query to get the todays conditions
    function getTodaysConditions(city) {
        // Create an AJAX call to retrieve data
        var queryParameters = {
            q: city,
            units: "metric",
            appid: OpenWeatherMapAPIKey,
        };
        var queryString = $.param(queryParameters);
        var queryURL = "https://api.openweathermap.org/data/2.5/weather?" + queryString;
        // Call with a get method
        $.ajax({ url: queryURL, method: 'get' }).then(function (response) {
            // if successfull then store the result
            setStoredSearchList(response.name + ", " + response.sys.country);
            //render the search list with recent search item at the top
            renderSearchList();
            // display the conditions for the today
            renderTodaysConditions(response);
            // clear the input text
            $("#city-input").val("");
        }).catch(function (err) {
            console.log(err);
        });
    };

    // display todays conditions
    function renderTodaysConditions(response) {
        // Populate the city and Country (with out the country it is hard to know which country the city is in)
        $("#city").text(response.name + " (" + response.sys.country + ")");
        // use the first item in the list for the first display
        // use moment to formate the date.
        var date = moment().format('DD/MM/YYYY');
        $("#date").text("(" + date + ")");
        // get the icon code and build the URL and add to the image.
        var iconCode = response.weather[0].icon;
        var iconurl = "http://openweathermap.org/img/w/" + iconCode + ".png";
        $("#weather-icon").attr("src", iconurl);
        // apply the other properties
        $("#temp").text(response.main.temp + ' ℃');
        $("#humidity").text(response.main.humidity + ' %');
        $("#wind").text(response.wind.speed + " km/h");
        // get the lon and lat to get the UV index, call the function to process
        var lat = response.coord.lat;
        var lon = response.coord.lon;

        renderUV(lon, lat);
    }

    // ajax query to get the five day forecast
    function getFiveDayForecast(city) {
        // Create an AJAX call to retrieve data Log the data in console
        var queryParameters = {
            q: city,
            units: "metric",
            appid: OpenWeatherMapAPIKey,
        };
        var queryString = $.param(queryParameters);
        var queryURL = "https://api.openweathermap.org/data/2.5/forecast?" + queryString;
        // Call with a get method
        $.ajax({ url: queryURL, method: 'get' }).then(function (response) {
            // reset the div containing the 5 day forcast
            $("#five-day-forecast").empty();
            // display the conditions for the next 5 days
            extractDays(response.list, date);
        }).catch(function (err) {
            console.log(err);
        });
    };

    // Loop through an array, extracting the data at midday or the last item if there not 5 midday items in the record
    function extractDays(list, date) {
        // counter to check 5 days are displayed
        var count = 0;
        // iterate over each item
        list.forEach(function (item) {
            var tempDate = moment(item.dt_txt).format('DD/MM/YYYY');
            var hour = moment(item.dt_txt).format('HH');
            // if the day is today then move to the next item using return
            if (tempDate === date) {
                return;
            }
            // if the hour is midday then display the conditions. It looks like when the api is called, the result start at the next 3hr slot 
            if (hour === "12") {
                renderDay(item);
                count++;
            }
        });
        // if there less than 5 days recorded then display the last conditions in the list
        if (count < 5) {
            renderDay(response.list[list.length - 1]);
        }
    };

    // display each day conditions
    function renderDay(item) {
        // create a div to append all the data too
        var $day = $("<div>");
        // gather the data into variables
        var dayDate = moment(item.dt_txt).format('DD/MM/YYYY');
        var hour = moment(item.dt_txt).format('HH:00:00');
        var dayIconCode = item.weather[0].icon;
        var dayIconurl = "http://openweathermap.org/img/w/" + dayIconCode + ".png";
        var dayTemp = item.main.temp;
        var dayHumidity = item.main.humidity;
        $day.addClass("list-group-item active")
        // append the gathered data to the div
        $day.append('<h5>' + dayDate + '</h5>');
        $day.append('<p>At: ' + hour + '</p>');
        $day.append('<img src="' + dayIconurl + '" alt="Weather Image"></img>');
        $day.append('<p>Temp: ' + dayTemp + ' &#8451;</p>');
        $day.append('<p>Humidity: ' + dayHumidity + ' &#x25;</p>');
        // prepend the day to the five day forecast id
        $("#five-day-forecast").append($day);
    };

    // color code the UV conditions
    function renderUV(lon, lat) {
        // create the uv query
        var queryParameters = {
            appid: OpenWeatherMapAPIKey,
            lat: lat,
            lon: lon,
        };
        var queryString = $.param(queryParameters);
        var queryURL = "https://api.openweathermap.org/data/2.5/uvi?" + queryString;
        //var uvQuery = "https://api.openweathermap.org/data/2.5/uvi?appid=" + OpenWeatherMapAPIKey + "&lat=" + lat + "&lon=" + lon;
        $.ajax({ url: queryURL, method: 'get' }).then(function (response) {
            var index = parseFloat(response.value);
            // based on the index range, set an attribute call index this will be used in css to color the background
            $("#uv-index").text(response.value);
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
        }).catch(function (err) {
            console.log(err);
        });
    };
});