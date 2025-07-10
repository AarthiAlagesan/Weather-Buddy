// main.js

document.addEventListener("DOMContentLoaded", function () {
  askUserLocation(); // ask on load
  setupManualInput(); // set up event for manual input box
});

function setupManualInput() {
  document.getElementById('city').addEventListener('input', function () {
    const city = this.value.trim();
    if (city) {
      getWeatherByCity(city);
    }
  });
}

function askUserLocation() {
  const popup = document.getElementById("location-popup");
  popup.style.display = "flex";

  document.getElementById("allow-location").onclick = async function () {
    popup.style.display = "none";

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser. Please enter your city manually.");
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      getWeatherByCoords(lat, lon);
    } catch (error) {
      alert("Location access failed or denied. Please enter your city manually.");
    }
  };

  document.getElementById("deny-location").onclick = function () {
    popup.style.display = "none";
    alert("You denied location access. Please enter your city manually.");
  };
}

async function getWeatherByCoords(lat, lon) {
  try {
    const res = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: {
        lat,
        lon,
        appid: '67c6327d367d37bcf736e52f2a869f16', // Replace with your API key
        units: 'metric'
      }
    });

    // ✅ Update the input field with the detected city name
    document.getElementById('city').value = res.data.city.name;

    updateUI(res.data);
  } catch (err) {
    console.error("Weather fetch failed:", err.message);
    alert("Unable to fetch weather. Try manual input.");
  }
}

async function getWeatherByCity(city) {
  try {
    const res = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: {
        q: city,
        appid: '67c6327d367d37bcf736e52f2a869f16',
        units: 'metric'
      }
    });
    updateUI(res.data);
  } catch (err) {
    alert("City not found. Please try again.");
  }
}

function updateUI(data) {
  const currentTemperature = data.list[0].main.temp;
  document.querySelector('.weather-temp').textContent = Math.round(currentTemperature) + 'ºC';

  const forecastData = data.list;
  const dailyForecast = {};

  forecastData.forEach((item) => {
    const day = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' });
    if (!dailyForecast[day]) {
      dailyForecast[day] = {
        minTemp: item.main.temp_min,
        maxTemp: item.main.temp_max,
        description: item.weather[0].description,
        humidity: item.main.humidity,
        windSpeed: item.wind.speed,
        icon: item.weather[0].icon,
      };
    } else {
      dailyForecast[day].minTemp = Math.min(dailyForecast[day].minTemp, item.main.temp_min);
      dailyForecast[day].maxTemp = Math.max(dailyForecast[day].maxTemp, item.main.temp_max);
    }
  });

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayData = dailyForecast[today];

  document.querySelector('.date-dayname').textContent = today;
  document.querySelector('.date-day').textContent = new Date().toUTCString().slice(5, 16);
  document.querySelector('.weather-icon').innerHTML = getWeatherIcon(todayData.icon);
  document.querySelector('.location').textContent = data.city.name;
  document.querySelector('.weather-desc').textContent = capitalizeWords(todayData.description);
  document.querySelector('.humidity .value').textContent = todayData.humidity + ' %';
  document.querySelector('.wind .value').textContent = todayData.windSpeed + ' m/s';

  const dayElements = document.querySelectorAll('.day-name');
  const tempElements = document.querySelectorAll('.day-temp');
  const iconElements = document.querySelectorAll('.day-icon');

  dayElements.forEach((dayElement, index) => {
    const day = Object.keys(dailyForecast)[index];
    const dayInfo = dailyForecast[day];
    if (dayInfo) {
      dayElement.textContent = day;
      tempElements[index].textContent = `${Math.round(dayInfo.minTemp)}º / ${Math.round(dayInfo.maxTemp)}º`;
      iconElements[index].innerHTML = getWeatherIcon(dayInfo.icon);
    }
  });
}

function getWeatherIcon(code) {
  return `<img src="https://openweathermap.org/img/wn/${code}@2x.png" alt="Weather Icon">`;
}

function capitalizeWords(sentence) {
  return sentence.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
