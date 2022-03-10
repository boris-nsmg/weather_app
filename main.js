loadCurrentCity();

let coords = [];
let dropdownCoords = [];
let endPointHours = 10;
let endPointDays = 7;
const cityNameEl = document.querySelector(".city-name");
const searchBoxEl = document.querySelector(".search-box");
const hiddenButtonEl = document.querySelector(".hidden-button");
const searchDropdownEl = document.querySelector(".search-dropdown");
const searchDropdownContent = searchDropdownEl.firstChild;
const currentTempEl = document.querySelector(".current-temp");
const currentFeelsLike = document.querySelector(".current-feels-like");
const currentWeatherEl = document.querySelector(".current-weather");
const hourlyForecastEl = document.querySelector(".hourly-forecast");
const hourlyForecastTableEl = hourlyForecastEl.firstChild;
const dailyForecastEl = document.querySelector(".daily-forecast");
const dailyForecastTableEl = dailyForecastEl.firstChild;

// Handles 'enter' key press in searchbox.
searchBoxEl.addEventListener('keyup', function(key) {
    if (key.keyCode === 13) {
        renderCityData(this.value);
    };
});

// Handles style change as well as functionality of icon in search bar. 
// If there is an value in searchbox displays the 'x' button and activates the buttons function, when box is empty changes button style back to magnifying glass.
searchBoxEl.addEventListener('input', function () {
    if (searchBoxEl && searchBoxEl.value) {
        hiddenButtonEl.classList.add('hidden-button-changed');
        hiddenButtonEl.addEventListener('click', function () {
            searchBoxEl.value = null;
            hiddenButtonEl.classList.remove('hidden-button-changed');
        });
    } else {
        hiddenButtonEl.classList.remove('hidden-button-changed');
    };
});

// Closes dropdown if clicked out of it.
document.addEventListener('click', function(click) {
    let clickInsideDropdown = searchDropdownEl.contains(click.target);
    if (!clickInsideDropdown) {
        searchDropdownEl.classList.add('hidden');
    };
});

// Handles a click on element in dropdown.
// Checks to see if element is already a ul or if it is an li, if it's an li it will select the ul parent of it. Grabs the hidden 
//  city coordinate data in that ul and passes them to weather render functions.
searchDropdownEl.addEventListener('click', function(click) {
    searchDropdownEl.classList.add('hidden');
    let liEl = '';
    if (click.target.outerHTML.startsWith('<span>')) {
        liEl = click.target.parentElement;
    } else {
        liEl = click.target;
    };
    coords = dropdownCoords[Array.prototype.indexOf.call(searchDropdownContent.childNodes, liEl)];
    endPointHours = 10;
    endPointDays = 7;
    renderCurrentWeather(coords);
    renderHourlyDailyWeather(coords);
});

// Displays all the cities grabbed from the search in the dropdown.
// Makes a list item for each city passed in, showing the city name, state, and country. Lastly adds hidden list item containing the coordinates.
// @param   cities  array   Array of the cities with the name inputed in the searchbox.
function displaySearchDropdown(cities) {
    dropdownCoords = [];
    searchDropdownContent.innerHTML = '';
    cities.forEach(city => {
        let cityData = document.createElement('li');
        let cityName = document.createElement('span');
        cityName.innerHTML = city.name;
        cityData.appendChild(cityName);
        let cityStateCountry = document.createElement('span');
        cityStateCountry.innerHTML = `${city.state}, ${city.country}`;
        cityData.appendChild(cityStateCountry);
        dropdownCoords.push([city.lat, city.lon]);
        searchDropdownContent.appendChild(cityData);
    });
    searchDropdownEl.classList.remove('hidden');
};

// Async await function grabs data from given api url.
// @param   url     string  Previously constructed url depending on what API is being accessed.
async function apiFetch(url) {
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.log(error);
    };
};

// Calls apiFetch to get the ip of the current user.
async function ipLookUp() {
    const url = `http://ip-api.com/json`;
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.log(error);
    };
};

// Calls ipLookUp to get data of current ip, uses that data to get location of user and render current weather.
async function loadCurrentCity() {
    const data = await ipLookUp();
    if (data.status === 'success') {
        coords = [data.lat, data.lon];
        renderCityData(data.city, true, coords);
    } else {
        console.log("Couldn't load current city");
    };
};

// Constructor for the url of the open weather map api used when searching for a city by name.
// Converts the city name inputed into a list of locations around the world by that name.
// @param   input   string  The value inputed by the user in the searchbox/selected from the dropdown.
async function getCityCoords(input) {
    const url = `http://api.openweathermap.org/geo/1.0/direct?q=${input}&limit=30&appid=211158a74590af681a5f6a978c12427e`;
    return await apiFetch(url);
};

// Parent function for rendering the weather of the city taken from the searchbox input.
// First checks if this is an IP lookup, if true will take the coords already passed in and render. Then it checks the length of
//  the cities passed depending on the search result in the geo locator api. If the length is 1 then just renders that city 
//  based on its coordinates. If length is 0 then there are no cities by that name and console logs the error. If the array contains
//  multiple cities it will pass them to the dropdown display function.
// @param   input       string      The name of the city being searched.
// @param   ipLookUp    boolean     (optional) If this render is from the ipLookUp function value is true, default is false.
// @param   coords      array       (optional) If the render is from the ipLookUp function, latitude and longitude will be passed.
async function renderCityData(input, ipLookUp, coords) {    // ipLookUp is a boolean value, stating wether or not this call is for initial load of site
    const cities = await getCityCoords(input);
    if (ipLookUp) {
        renderCurrentWeather(coords);
        renderHourlyDailyWeather(coords)
    } else {
        if (cities.length === 1) {
            coords = [cities[0].lat, cities[0].lon]
            endPointHours = 10;
            endPointDays = 7;
            renderCurrentWeather(coords);
            renderHourlyDailyWeather(coords)
        } else if (cities.length === 0) {
            console.log('No cities by this name found')
        } else if (cities.length > 1) {
            displaySearchDropdown(cities);
        } else {
            console.log('Problem searching for this result');
        };
    };
};


// Constructor for the url of the open weather map api used when getting weather data based on coordinates.
// Gathers all the available current data about the weatehr of that specific coordinate.
// @param   coords  array   Latitude and longitude of the desired location.
async function getCurrentWeather(coords) {
    const url = `http://api.openweathermap.org/data/2.5/weather?lat=${coords[0]}&lon=${coords[1]}&units=metric&appid=211158a74590af681a5f6a978c12427e`;
    return await apiFetch(url)
};

// Renders the data gathered from the api call onto the page.
// Displays the name, temperature followed by degrees symbol, feels like temperature in the same format, and a description of the weather.
// @param   coords  array   Latitude and longitude of the desired location.
async function renderCurrentWeather(coords) {
    const data = await getCurrentWeather(coords); 
    cityNameEl.textContent = data.name;
    currentTempEl.innerHTML = data.main.temp;
    currentFeelsLike.innerHTML = 'Feels like: ' + data.main.feels_like;
    currentWeatherEl.textContent = data.weather[0].description;
};

// Handles clicks on the 'Hourly Forecast' and 'Daily Forecast' buttons on the page.
// Toggles the display state of both buttons depending on what one is clicked.
// @param   section string  Specifies which button is being pressed.
function showMoreBtn(section) {
    if (section === 'hourlyForecast') {
        if (hourlyForecastEl.classList.contains('hidden')) {
            hourlyForecastEl.classList.remove('hidden');
        } else {
            hourlyForecastEl.classList.add('hidden');
        };
    } else if (section === 'dailyForecast') {
        if (dailyForecastEl.classList.contains('hidden')) {
            dailyForecastEl.classList.remove('hidden');
        } else {
            dailyForecastEl.classList.add('hidden');
        };
    }dailyForecastEl
};

// Constructor for the url of the one call open weather map api used to get the hourly weather data based on coordinates, all other data is excluded in the call.
// Gathers all the available hourly data about the weatehr of that specific coordinate.
// @param   coords  array   Latitude and longitude of the desired location.
async function getHourlyDailyWeather(coords) {
    const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${coords[0]}&lon=${coords[1]}&exclude=minutely,alerts,current&units=metric&appid=211158a74590af681a5f6a978c12427e`;
    return await apiFetch(url);
};

// Handles the rendering of both the hourly weather table and daily weather table, or either one seperatly.
// Grabs all the data from the API call, then checks if onlyRenderOne is a truthy value. If it is it will render only one of the two depending on the value of onlyRenderOne.
// @param   coords          array   Latitude and longitude of the desired location.
// @param   onlyRenderOne   string  (optional) Specifies which section to render if only one is being updated.
async function renderHourlyDailyWeather(coords, onlyRenderOne) {
    const data = await getHourlyDailyWeather(coords);
    if (onlyRenderOne) {
        if (onlyRenderOne === 'hourly') {
            renderHourlyWeather(data.hourly);
        } else if (onlyRenderOne === 'daily') {
            renderDailyWeather(data.daily);
        } else {
            console.log('Invalid value for onlyRenderOne parameter');
        };
    } else {
        renderHourlyWeather(data.hourly);
        renderDailyWeather(data.daily);
    };
};

// Dynamically populates a table with the hourly data based on the global variable endPointHours. Then dislays that table to the site.
// Starts by constructing constants for every piece of data that will be displayed and creates a 2-D array of each hour and its data points. Incriments the global
//  constant endPointHours by 3 for the next time the expand table button is clicked. If there already exists a table removes it. For each loop creates a single 
//  table with a tr for each hour and a td for each piece of information of that hour. Finally, creates the button for expanding the table and adds it to the table end.
// @param   hours   array   Contains the full available data of each hour in the API call.
function renderHourlyWeather(hours) {
    let hourlyData = [];
    for (let i = 0; i < endPointHours; i++) {
        const hour = hours[i];
        const fullDate = new Date(hour.dt * 1000);
        const time = fullDate.getHours() + ':00';
        const temp = hour.temp;
        const weather = hour.weather[0].main;
        const hourArray = [time, temp, weather];
        hourlyData.push(hourArray);
    };
    endPointHours += 3;

    if (hourlyForecastEl.childNodes.length !== 0) {
        hourlyForecastEl.removeChild(hourlyForecastEl.firstChild);
    };

    let newTable = document.createElement('table');
    hourlyData.forEach(array => {
        let newRow = document.createElement('tr');
        for (let i = 0; i < array.length; i++) {
            let newData = document.createElement('td');
            newData.innerHTML = array[i];
            if (i === 1) {
                newData.classList.add('table-temp');
            };
            newRow.appendChild(newData);
        };
        newTable.appendChild(newRow);
    });

    let buttonSpan = document.createElement('span');
    buttonSpan.classList.add('expand-table-button');
    let button = document.createElement('button');
    button.setAttribute("onclick", "expandTable('hourly')");
    buttonSpan.appendChild(button);
    newTable.appendChild(buttonSpan);
    hourlyForecastEl.appendChild(newTable);
};

// Dynamically populates a table with the daily data based on the global variable endPointDays. Then dislays that table to the site.
// Starts by constructing constants for every piece of data that will be displayed and creates a 2-D array of each day and its data points. Incriments the global
//  constant endPointDays by 1 for the next time the expand table button is clicked. If there already exists a table removes it. For each loop creates a single 
//  table with a tr for each day and a td for each piece of information of that day. Finally, creates the button for expanding the table and adds it to the table end.
// @param   days   array   Contains the full available data of each day in the API call.
function renderDailyWeather(days) {
    let dailyData = [];
    for (let i = 0; i < endPointDays; i++) {
        const day = days[i];
        const fullDate = new Date(day.dt * 1000);
        const date = fullDate.toString().slice(0, 3);
        const avgTemp = day.temp.day;
        const minTemp = day.temp.min;
        const maxTemp = day.temp.max;
        const weather = day.weather[0].main;
        const dayArray = [date, avgTemp, minTemp, maxTemp, weather];
        dailyData.push(dayArray);
    };
    endPointDays += 1;

    if (dailyForecastEl.childNodes.length !== 0) {
        dailyForecastEl.removeChild(dailyForecastEl.firstChild);
    };

    let newTable = document.createElement('table');
    dailyData.forEach(array => {
        let newRow = document.createElement('tr');
        for (let i = 0; i < array.length; i++) {
            let newData = document.createElement('td');
            newData.innerHTML = array[i];
            if (i === 1) {
                newData.classList.add('table-temp');
            } else if (i === 2 || i === 3) {
                newData.classList.add('table-minmax');
                if (i === 2) {
                    newData.classList.add('min-temp');
                } else {
                    newData.classList.add('max-temp');
                };
            };
            newRow.appendChild(newData);
        };
        newTable.appendChild(newRow);
    });

    let buttonSpan = document.createElement('span');
    buttonSpan.classList.add('expand-table-button');
    let button = document.createElement('button');
    button.setAttribute("onclick", "expandTable('daily')");
    buttonSpan.appendChild(button);
    newTable.appendChild(buttonSpan);
    dailyForecastEl.appendChild(newTable);
};

// Handles clicks on the expand table button at the end of Hourly Forecast and Daily Forecast respectivley.
// Calls the renderHourlyDailyWeather function with a specified table passed, so as to only re-render that one table.
// @param   talbe   string  Either 'hourly' or 'daily', used to specify which table is to be re-rendered and expanded.
function expandTable(table) {
    renderHourlyDailyWeather(coords, table);
};