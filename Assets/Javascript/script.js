$(document).ready(function () {

    // Get an API Key from OpenWeatherMap API
    var APIKey = "53b3da334ab80c9261f53586ac885ee0";

    loadPage();

    // load/render the page
    function loadPage() {

    };

    // Update the today variable to the selected date and load the page
    $("#select-city-btn").on("click", function () {
        event.preventDefault();
        var city = $("#city-input").val().trim();
        console.log(city);
        // Create an AJAX call to retrieve data Log the data in console
        var query5dayURL = "https://api.openweathermap.org/data/2.5/forecast?q=" + city + "&appid=" + APIKey;
        // Call with a get method
        $.ajax({ url: query5dayURL, method: 'get' }).then(function (response) {
            // Populate the city and Country (with out the country it is hard to know which country the city is in)
            $("#city").text(response.city.name + " (" + response.city.country + ")");
            // use the first item in the list for the first display
            // use moment to formate the date.
            var date = moment(response.list[0].dt_txt).format('DD/MM/YYYY')
            $("#date").text("(" + date + ")");
            // get the icon code and build the URL and add to the image.
            var iconcode = response.list[0].weather[0].icon;
            var iconurl = "http://openweathermap.org/img/w/" + iconcode + ".png";
            $("#weather-icon").attr("src", iconurl);
            // apply the other properties
            var F = ((response.list[0].main.temp - 273.15) * 1.80 + 32).toFixed(2)
            $("#temp").text(F);
            $("#humidity").text(response.list[0].main.humidity);
            $("#wind").text(response.list[0].wind.speed);
            // get the lon and lat to get the UV index, call the function to process
            var lat = response.city.coord.lat;
            var lon = response.city.coord.lon;
            setUV(lon, lat);
        }).catch(function (err) {
            console.log(err);
        });
    });

    function setUV(lon, lat) {
        // create the uv query
        var uvQuery = "https://api.openweathermap.org/data/2.5/uvi?appid=" + APIKey + "&lat=" + lat + "&lon=" + lon;
        $.ajax({ url: uvQuery, method: 'get' }).then(function (response) {
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