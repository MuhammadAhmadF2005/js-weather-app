const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const geoUrl = "https://api.openweathermap.org/geo/1.0/direct?q=";

const searchBox = document.querySelector(".search input");
const searchButton = document.querySelector(".search button");
const loadingEl = document.querySelector(".loading");
const errorEl = document.querySelector(".error");
const suggestionBox = document.querySelector(".autocomplete");

let lastWeatherData;
let isCelsius = true;

const iconMap = {
    Clear: "clear.png",
    Clouds: "clouds.png",
    Rain: "rain.png",
    Drizzle: "drizzle.png",
    Mist: "mist.png",
    Snow: "snow.png"
};

searchButton.addEventListener("click", () => {
    const city = searchBox.value.trim();
    if (city !== "") {
        suggestionBox.innerHTML = "";
        checkWeather(city);
    }
});

searchBox.addEventListener("input", debounce(suggestCities, 300));

document.querySelector(".toggle-units").addEventListener("click", () => {
    isCelsius = !isCelsius;
    document.querySelector(".toggle-units").innerText = isCelsius ? "°F" : "°C";
    if (lastWeatherData) updateWeatherUI(lastWeatherData);
});

async function checkWeather(city) {
    showLoading();

    try {
        const response = await fetch(apiUrl + city + `&appid=${API_KEY}`);
        if (response.status === 404) {
            showError("City not found");
            hideLoading();
            return;
        }

        const data = await response.json();
        lastWeatherData = data;

        updateWeatherUI(data);
        saveRecentSearch(city);

    } catch (err) {
        showError("Network error");
    }

    hideLoading();
}

function updateWeatherUI(data) {
    const temp = isCelsius
        ? Math.round(data.main.temp)
        : Math.round((data.main.temp * 9) / 5 + 32);

    document.querySelector(".city").innerText = data.name;
    document.querySelector(".temp").innerText = temp + (isCelsius ? "°C" : "°F");
    document.querySelector(".humidity").innerText = data.main.humidity + "%";
    document.querySelector(".wind").innerText = data.wind.speed + " km/h";

    const mainWeather = data.weather[0].main;
    document.querySelector(".weather-icon").src = `images/${iconMap[mainWeather] || "clear.png"}`;

    // Background
    document.body.className = "";
    document.body.classList.add("weather-" + mainWeather.toLowerCase());
}

function showLoading() {
    loadingEl.style.display = "block";
    errorEl.style.display = "none";
}

function hideLoading() {
    loadingEl.style.display = "none";
}

function showError(message = "City not found") {
    errorEl.textContent = message;
    errorEl.style.display = "block";
}

function saveRecentSearch(city) {
    let searches = JSON.parse(localStorage.getItem("recent")) || [];
    if (!searches.includes(city)) {
        searches.unshift(city);
        if (searches.length > 5) searches.pop();
        localStorage.setItem("recent", JSON.stringify(searches));
        renderRecentSearches();
    }
}

function renderRecentSearches() {
    const searches = JSON.parse(localStorage.getItem("recent")) || [];
    const container = document.querySelector(".recent-searches");
    container.innerHTML = "";

    searches.forEach(city => {
        const btn = document.createElement("button");
        btn.textContent = city;
        btn.onclick = () => checkWeather(city);
        container.appendChild(btn);
    });
}

async function suggestCities() {
    const query = searchBox.value.trim();
    if (query.length < 2) {
        suggestionBox.innerHTML = "";
        return;
    }

    try {
        const response = await fetch(`${geoUrl}${query}&limit=5&appid=${API_KEY}`);
        const cities = await response.json();

        suggestionBox.innerHTML = "";
        cities.forEach(city => {
            const li = document.createElement("li");
            li.textContent = `${city.name}, ${city.country}`;
            li.onclick = () => {
                searchBox.value = city.name;
                suggestionBox.innerHTML = "";
                checkWeather(city.name);
            };
            suggestionBox.appendChild(li);
        });
    } catch (err) {
        suggestionBox.innerHTML = "";
    }
}

function debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Initial render
renderRecentSearches();
