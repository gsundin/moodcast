document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const locationDisplay = document.getElementById('location-display');
    const weatherDisplay = document.getElementById('weather-display');
    const background = document.getElementById('background');
    const foreground = document.getElementById('foreground');
    const effects = document.getElementById('effects');
    
    // Debug elements
    const debugBtn = document.getElementById('debug-btn');
    const debugPanel = document.getElementById('debug-panel');
    const zipInput = document.getElementById('zip-input');
    const updateLocationBtn = document.getElementById('update-location-btn');
    const randomWeatherBtn = document.getElementById('random-weather-btn');
    
    // New debug controls
    const tempSlider = document.getElementById('temp-slider');
    const tempValue = document.getElementById('temp-value');
    const applyTempBtn = document.getElementById('apply-temp-btn');
    const dayNightToggle = document.getElementById('day-night-toggle');
    
    // Global variables
    let currentWeatherData = null;
    let userForcedDayNight = null; // null = auto, true = day, false = night

    console.log("Weather Vibe Check initializing...");

    // Initialize app by getting location and weather data
    initializeApp();

    // Debug mode toggle
    debugBtn.addEventListener('click', () => {
        debugPanel.style.display = debugPanel.style.display === 'none' || debugPanel.style.display === '' ? 'block' : 'none';
    });

    // Update location button click handler
    updateLocationBtn.addEventListener('click', () => {
        const zipCode = zipInput.value.trim();
        if (zipCode) {
            updateLocationByZip(zipCode);
        } else {
            alert('Please enter a valid ZIP code');
        }
    });

    // Random weather button click handler
    randomWeatherBtn.addEventListener('click', () => {
        generateRandomWeather();
    });

    // Allow pressing Enter in the zip code input
    zipInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            updateLocationBtn.click();
        }
    });

    // Temperature slider event listeners
    tempSlider.addEventListener('input', () => {
        tempValue.textContent = tempSlider.value;
    });
    
    applyTempBtn.addEventListener('click', () => {
        applyCustomTemperature(parseInt(tempSlider.value));
    });
    
    // Day/Night toggle event listener
    dayNightToggle.addEventListener('click', () => {
        toggleDayNightMode();
    });

    /**
     * Initialize the app by getting location and weather data
     */
    function initializeApp() {
        // Reset display
        locationDisplay.textContent = 'Finding your location...';
        weatherDisplay.textContent = '';
        
        // Try to get user location and weather data
        getUserLocationFromIP()
            .then(locationData => {
                console.log("Location data received:", locationData);
                // Display location information
                const { city, region } = locationData;
                locationDisplay.textContent = `${city}`;
                
                // Get weather data for the location
                return getWeatherData(locationData);
            })
            .then(weatherData => {
                console.log("Weather data received:", weatherData);
                // Display weather information in Fahrenheit
                weatherDisplay.textContent = `${weatherData.temperature}°F, ${weatherData.condition}`;
                
                // Apply weather animations
                applyWeatherAnimations(weatherData);
            })
            .catch(error => {
                console.error('Error in main process:', error);
                locationDisplay.textContent = 'Unable to get location';
                weatherDisplay.textContent = 'Weather data unavailable';
                
                console.log("Falling back to mock data");
                // Use fallback mock data if real data can't be fetched
                const mockData = getMockWeatherData();
                console.log("Mock data:", mockData);
                applyWeatherAnimations(mockData);
            });
    }

    /**
     * Update location by ZIP code
     * @param {string} zipCode The ZIP/postal code to look up
     */
    function updateLocationByZip(zipCode) {
        locationDisplay.textContent = `Looking up location for ${zipCode}...`;
        weatherDisplay.textContent = '';
        
        // Get location data from ZIP code
        fetch(`https://api.zippopotam.us/us/${zipCode}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`ZIP code lookup failed: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("ZIP code data:", data);
                
                // Format the location data
                const locationData = {
                    city: data.places[0]['place name'],
                    region: data.places[0]['state abbreviation'],
                };
                
                // Update location display
                locationDisplay.textContent = `${locationData.city}`;
                
                // Get weather for the new location
                return getWeatherData(locationData);
            })
            .then(weatherData => {
                // Update weather display
                weatherDisplay.textContent = `${weatherData.temperature}°F, ${weatherData.condition}`;
                
                // Apply new weather animations
                applyWeatherAnimations(weatherData);
                
                // Hide debug panel
                debugPanel.style.display = 'none';
            })
            .catch(error => {
                console.error('Error updating location:', error);
                locationDisplay.textContent = `Error finding location for ${zipCode}`;
                weatherDisplay.textContent = 'Weather data unavailable';
                
                // Use mock data as fallback
                const mockData = getMockWeatherData();
                applyWeatherAnimations(mockData);
            });
    }

    /**
     * Get user's location from their IP address
     * @returns {Promise} Promise that resolves to location object
     */
    async function getUserLocationFromIP() {
        try {
            // Using geojs.io - no API key required and generally CORS-friendly
            const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
            if (!response.ok) {
                throw new Error(`Failed to get location data: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            
            console.log("Raw location data:", data);
            
            // Format the response to match our expected structure
            return {
                city: data.city,
                region: data.region,
            };
        } catch (error) {
            console.error('Error getting location details:', error);
            
            // For testing purposes, return a default location
            console.log("Using default location data");
            return {
                city: "New York",
                region: "New York",
            };
        }
    }

    /**
     * Get weather data for a location using OpenWeatherMap API
     * @param {Object} locationData Location data object with city and region
     * @returns {Promise} Promise that resolves to weather object
     */
    async function getWeatherData(locationData) {
        try {
            // Get API key from external config file
            const apiKey = API_CONFIG.OPENWEATHER_API_KEY;
            
            // Use city name for simplicity with proper encoding
            const encodedCity = encodeURIComponent(locationData.city);
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&units=imperial&appid=${apiKey}`;
            
            console.log("Fetching weather from URL:", url);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to get weather data: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log("Raw weather data:", data);
            
            return {
                temperature: Math.round(data.main.temp),
                humidity: data.main.humidity,
                condition: data.weather[0].main,
                windSpeed: data.wind.speed,
                description: data.weather[0].description
            };
        } catch (error) {
            console.error('Error getting weather data:', error);
            throw error;
        }
    }

    /**
     * Get mock weather data for fallback when API calls fail
     * @returns {Object} Mock weather data
     */
    function getMockWeatherData() {
        // Array of possible weather conditions for testing
        const conditions = ['Clear', 'Clouds', 'Rain', 'Snow', 'Fog'];
        const minTemp = -40; // Minimum temperature in Fahrenheit
        const maxTemp = 120; // Minimum temperature in Fahrenheit
        const temperature = Math.round(Math.random() * (maxTemp - minTemp) + minTemp); // Random temperature in Fahrenheit
        
        return {
            temperature: temperature,
            humidity: Math.floor(Math.random() * 100),
            condition: conditions[Math.floor(Math.random() * conditions.length)],
            windSpeed: Math.random() * 20,
            description: 'Mock weather data'
        };
    }

    /**
     * Generate random weather for testing different animations
     */
    function generateRandomWeather() {
        const mockData = getMockWeatherData();
        
        // Update displays
        locationDisplay.textContent = 'Debug Mode';
        weatherDisplay.textContent = `${mockData.temperature}°F, ${mockData.condition}`;
        
        // Apply animations based on the random weather
        applyWeatherAnimations(mockData);
        
        // Add a visual indicator that we're in random mode
        document.body.classList.add('random-mode');
        
        // Log the random weather for debugging
        console.log('Random weather generated:', mockData);
    }

    /**
     * Apply custom temperature from the slider
     * @param {number} temperature The temperature in Fahrenheit
     */
    function applyCustomTemperature(temperature) {
        // Create a modified version of the current weather data (or a default if none exists)
        const weatherData = currentWeatherData || {
            temperature: temperature,
            humidity: 50,
            condition: 'Clear',
            windSpeed: 5,
            description: 'Custom temperature'
        };
        
        // Update the temperature
        weatherData.temperature = temperature;
        currentWeatherData = weatherData;
        
        // Update the weather display
        locationDisplay.textContent = 'Debug Mode';
        weatherDisplay.textContent = `${weatherData.temperature}°F, ${weatherData.condition}`;
        
        // Apply the weather animations
        applyWeatherAnimations(weatherData);
    }
    
    /**
     * Toggle between day and night modes
     */
    function toggleDayNightMode() {
        if (userForcedDayNight === null || userForcedDayNight === false) {
            // Switch to day mode
            userForcedDayNight = true;
            dayNightToggle.innerHTML = '<span class="toggle-icon">☀️</span><span class="toggle-label">Day Mode</span>';
            dayNightToggle.classList.remove('night-mode');
            dayNightToggle.classList.add('day-mode');
        } else {
            // Switch to night mode
            userForcedDayNight = false;
            dayNightToggle.innerHTML = '<span class="toggle-icon">🌙</span><span class="toggle-label">Night Mode</span>';
            dayNightToggle.classList.remove('day-mode');
            dayNightToggle.classList.add('night-mode');
        }
        
        // Re-apply animations with the new day/night setting
        if (currentWeatherData) {
            applyWeatherAnimations(currentWeatherData);
        }
    }

    /**
     * Apply animations based on weather data
     * @param {Object} weatherData Weather data object
     */
    function applyWeatherAnimations(weatherData) {
        // Store the current weather data for future reference
        currentWeatherData = weatherData;
        
        const { temperature, condition, humidity, windSpeed } = weatherData;
        
        // Clear existing classes
        background.className = 'animation-element';
        foreground.className = 'animation-element';
        effects.className = 'animation-element';
        
        // Clear existing precipitation elements
        document.getElementById('snowflake-container').innerHTML = '';
        document.getElementById('raindrop-container').innerHTML = '';
        
        // Determine if it's day or night based on actual time or user forced setting
        let isDaytime;
        if (userForcedDayNight !== null) {
            // Use the user's forced day/night setting
            isDaytime = userForcedDayNight;
        } else {
            // Default behavior - check actual time
            const currentHour = new Date().getHours();
            isDaytime = currentHour >= 6 && currentHour < 18; // 6 AM to 6 PM is daytime
        }
        
        // Use chroma.js to map temperature to color
        const tempScale = chroma.scale([
            '#dff8ff',  // -40
            '#b0d0ff',  // 0
            '#89bfff',  // 32
            '#80cbc4',  // 50
            '#aed581',  // 65
            '#ffd54f',  // 75
            '#ff8a65',  // 85
            '#f4511e',  // 100
            '#b71c1c'   // 120
        ]).domain([-40, 0, 32, 50, 65, 75, 85, 100, 120]);
        
        // Get primary color based on temperature
        const mainColor = tempScale(temperature).hex();
        
        // Get a slightly shifted temperature for the secondary color
        const tempOffset = Math.min(120, Math.max(-40, temperature + 15));
        const secondaryColor = tempScale(tempOffset).hex();
        
        // Apply colors with day/night adjustment
        const adjustedMainColor = adjustColorForDayNight(mainColor, isDaytime);
        const adjustedSecondaryColor = adjustColorForDayNight(secondaryColor, isDaytime);
        
        // Apply custom temperature-based background with the mapped colors
        background.style.background = `linear-gradient(120deg, ${adjustedMainColor} 0%, ${adjustedSecondaryColor} 100%)`;
        background.style.backgroundSize = '200% 200%';
        
        // Add animation class based on temperature range
        if (temperature > 85) {
            background.classList.add('hot');
        } else if (temperature > 65) {
            background.classList.add('warm');
        } else if (temperature > 32) {
            background.classList.add('cool');
        } else {
            background.classList.add('cold');
        }
        
        // Apply temperature-specific visual effects
        if (temperature < 32) {
            // Cold with frost overlay
            const frostOverlay = document.createElement('div');
            frostOverlay.className = 'frost-overlay';
            effects.appendChild(frostOverlay);
            
            // Add slow snow particles for very cold
            createSnowflakes(15); // Fewer, slower snowflakes for the frost effect
        } else if (temperature >= 40 && temperature <= 59) {
            // Light wind effect for 40s-50s
            effects.classList.add('light-wind');
        } else if (temperature >= 75 && temperature <= 85) {
            // Sun glints for warm, pleasant weather
            effects.classList.add('sun-glints');
        } else if (temperature >= 100) {
            // Heat shimmer for hot temperatures
            effects.classList.add('heat-shimmer');
        }
        
        // Set inverse text color for better visibility
        const inverseColor = getInverseColor(adjustedMainColor);
        document.documentElement.style.setProperty('--text-color', inverseColor);
        
        // Apply day/night mode
        document.documentElement.style.setProperty('--is-daytime', isDaytime ? '1' : '0');
        
        // Apply weather condition animations
        switch (condition) {
            case 'Clouds':
                foreground.classList.add('clouds');
                break;
            case 'Rain':
            case 'Drizzle':
                createRaindrops();
                break;
            case 'Snow':
                createSnowflakes(50); // Full snow effect
                // Add enhanced text shadow for better visibility during snow
                document.documentElement.style.setProperty('--text-shadow', '0 0 10px rgba(0, 0, 0, 0.8), 0 0 5px rgba(0, 0, 0, 0.9)');
                break;
            case 'Fog':
            case 'Mist':
            case 'Haze':
                foreground.classList.add('fog');
                break;
            default:
                // Reset text shadow to default for clear conditions
                document.documentElement.style.setProperty('--text-shadow', '0 0 10px rgba(0, 0, 0, 0.5)');
                break;
        }
        
        // Apply humidity effect if high
        if (humidity > 80) {
            effects.classList.add('humid');
        }
        
        // Apply wind speed effect
        if (windSpeed > 10) {
            background.classList.add('wind-high');
        } else if (windSpeed > 5) {
            background.classList.add('wind-low');
        }
    }
    
    /**
     * Adjust color based on day/night
     * @param {string} hexColor The hex color to adjust
     * @param {boolean} isDaytime Whether it's daytime
     * @returns {string} Adjusted color in hex format
     */
    function adjustColorForDayNight(hexColor, isDaytime) {
        if (isDaytime) {
            return hexColor; // No adjustment for daytime
        } else {
            // For nighttime, darken the color
            return chroma(hexColor).darken(1.2).hex();
        }
    }
    
    /**
     * Create individual snowflakes
     * @param {number} count Number of snowflakes to create
     */
    function createSnowflakes(count = 50) {
        const snowflakeContainer = document.getElementById('snowflake-container');
        
        for (let i = 1; i <= count; i++) {
            // Smaller snowflakes - between 0.1vw and 0.5vw
            const size = (Math.random() * 2.5 * 0.2).toFixed(2);
            const leftIni = (Math.random() * 20 - 10).toFixed(2); // Random initial left offset
            const leftEnd = (Math.random() * 20 - 10).toFixed(2); // Random final left offset
            const left = Math.random() * 100; // Random horizontal position
            
            // Duration based on count - slower for frost effect (fewer flakes)
            const baseDuration = count < 20 ? 15 : 8; // Slower for frost effect
            const duration = baseDuration + Math.random() * 12;
            const delay = -(Math.random() * 10); // Random start delay
            
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            if (i % 6 === 0) snowflake.classList.add('blur'); // Add blur to every 6th snowflake
            
            snowflake.style.setProperty('--size', `${size}vw`);
            snowflake.style.setProperty('--left-ini', `${leftIni}vw`);
            snowflake.style.setProperty('--left-end', `${leftEnd}vw`);
            snowflake.style.left = `${left}vw`;
            snowflake.style.animation = `snowfall ${duration}s linear infinite`;
            snowflake.style.animationDelay = `${delay}s`;
            
            // For frost effect (fewer snowflakes), make them more transparent
            if (count < 20) {
                snowflake.style.opacity = '0.5';
            }
            
            snowflakeContainer.appendChild(snowflake);
        }
    }
    
    /**
     * Create individual raindrops
     */
    function createRaindrops() {
        const raindropContainer = document.getElementById('raindrop-container');
        const raindropCount = 70; // More raindrops than snowflakes
        
        for (let i = 1; i <= raindropCount; i++) {
            // Even smaller raindrops - between 0.05vw and 0.15vw (was 0.1vw to 0.3vw)
            const size = (Math.random() * 1.5 * 0.1).toFixed(2); 
            const leftIni = (Math.random() * 8 - 4).toFixed(2); // Smaller horizontal drift
            const leftEnd = (Math.random() * 8 - 4).toFixed(2);
            const left = Math.random() * 100;
            // Even faster rain - between 0.4s and 1.3s
            const duration = 0.4 + Math.random() * 0.9; 
            const delay = -(Math.random() * 1.5); // Shorter delay
            
            const raindrop = document.createElement('div');
            raindrop.className = 'raindrop';
            if (i % 8 === 0) raindrop.classList.add('blur'); // Add blur to some raindrops
            
            raindrop.style.setProperty('--size', `${size}vw`);
            raindrop.style.setProperty('--left-ini', `${leftIni}vw`);
            raindrop.style.setProperty('--left-end', `${leftEnd}vw`);
            raindrop.style.left = `${left}vw`;
            raindrop.style.animation = `rainfall ${duration}s linear infinite`;
            raindrop.style.animationDelay = `${delay}s`;
            
            raindropContainer.appendChild(raindrop);
        }
    }
    
    /**
     * Map temperature to a color in the rainbow spectrum
     * @param {number} temperature Temperature in Fahrenheit
     * @param {boolean} isDaytime Whether it's currently daytime
     * @returns {Object} Object with main color and secondary color
     */
    function getTemperatureColor(temperature, isDaytime) {
        // Define temperature ranges for color mapping
        const tempMin = 0;   // 0°F (very cold)
        const tempMax = 110; // 110°F (very hot)
        
        // Normalize temperature to 0-1 range
        let normalizedTemp = Math.max(0, Math.min(1, (temperature - tempMin) / (tempMax - tempMin)));
        
        // Rainbow colors from cold to hot (from blue to red)
        const colorStops = [
            { pos: 0.0, r: 75, g: 0, b: 130 },     // Indigo/Violet (coldest)
            { pos: 0.2, r: 0, g: 0, b: 255 },      // Blue
            { pos: 0.4, r: 0, g: 255, b: 255 },    // Cyan/Aqua
            { pos: 0.5, r: 0, g: 255, b: 0 },      // Green
            { pos: 0.6, r: 255, g: 255, b: 0 },    // Yellow
            { pos: 0.8, r: 255, g: 165, b: 0 },    // Orange
            { pos: 1.0, r: 255, g: 0, b: 0 }       // Red (hottest)
        ];
        
        // Find the two color stops that our temperature falls between
        let lowerStop = colorStops[0];
        let upperStop = colorStops[colorStops.length - 1];
        
        for (let i = 0; i < colorStops.length - 1; i++) {
            if (normalizedTemp >= colorStops[i].pos && normalizedTemp <= colorStops[i + 1].pos) {
                lowerStop = colorStops[i];
                upperStop = colorStops[i + 1];
                break;
            }
        }
        
        // Calculate how far between the two stops our temperature is (0-1)
        const rangePct = (normalizedTemp - lowerStop.pos) / (upperStop.pos - lowerStop.pos);
        
        // Interpolate between the two color stops
        let r = Math.round(lowerStop.r + rangePct * (upperStop.r - lowerStop.r));
        let g = Math.round(lowerStop.g + rangePct * (upperStop.g - lowerStop.g));
        let b = Math.round(lowerStop.b + rangePct * (upperStop.b - lowerStop.b));
        
        // For secondary color, shift slightly in the rainbow (complement within the rainbow)
        let secondaryNormalized = normalizedTemp + 0.15;
        if (secondaryNormalized > 1) secondaryNormalized -= 1;
        
        // Find secondary color stops
        let secondaryLowerStop = colorStops[0];
        let secondaryUpperStop = colorStops[colorStops.length - 1];
        
        for (let i = 0; i < colorStops.length - 1; i++) {
            if (secondaryNormalized >= colorStops[i].pos && secondaryNormalized <= colorStops[i + 1].pos) {
                secondaryLowerStop = colorStops[i];
                secondaryUpperStop = colorStops[i + 1];
                break;
            }
        }
        
        // Calculate secondary color
        const secondaryRangePct = (secondaryNormalized - secondaryLowerStop.pos) / (secondaryUpperStop.pos - secondaryLowerStop.pos);
        let sr = Math.round(secondaryLowerStop.r + secondaryRangePct * (secondaryUpperStop.r - secondaryLowerStop.r));
        let sg = Math.round(secondaryLowerStop.g + secondaryRangePct * (secondaryUpperStop.g - secondaryLowerStop.g));
        let sb = Math.round(secondaryLowerStop.b + secondaryRangePct * (secondaryUpperStop.b - secondaryLowerStop.b));
        
        // Adjust colors based on time of day (darker at night, lighter in day)
        if (!isDaytime) {
            // Night mode: darker, more subdued colors
            r = Math.round(r * 0.6);
            g = Math.round(g * 0.6);
            b = Math.round(b * 0.7); // Keep slightly more blue at night
            
            sr = Math.round(sr * 0.6);
            sg = Math.round(sg * 0.6);
            sb = Math.round(sb * 0.7);
        } else {
            // Day mode: brighter colors (no change)
        }
        
        // Convert to hex
        const mainColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        const secondaryColor = `#${sr.toString(16).padStart(2, '0')}${sg.toString(16).padStart(2, '0')}${sb.toString(16).padStart(2, '0')}`;
        
        return {
            color: mainColor,
            secondaryColor: secondaryColor
        };
    }
    
    /**
     * Calculate the inverse color for better text visibility
     * @param {string} hexColor The hex color to invert
     * @returns {string} The inverse color in hex format
     */
    function getInverseColor(hexColor) {
        // Remove # if present
        hexColor = hexColor.replace('#', '');
        
        // Convert to RGB
        let r = parseInt(hexColor.substr(0, 2), 16);
        let g = parseInt(hexColor.substr(2, 2), 16);
        let b = parseInt(hexColor.substr(4, 2), 16);
        
        // Invert colors
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;
        
        // Check if result would be too dark, if so use white
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        if (brightness < 128) {
            return '#ffffff'; // Use white for dark backgrounds
        }
        
        // Convert back to hex
        return '#' + 
            (r.toString(16).padStart(2, '0')) +
            (g.toString(16).padStart(2, '0')) +
            (b.toString(16).padStart(2, '0'));
    }
});