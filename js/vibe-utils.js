// Vibe words and related functionality

/**
 * Collection of vibe words mapped to weather conditions
 * Each weather condition can have multiple vibe words for variety
 */
const vibeWordMap = {
    // Hot weather conditions
    "Hot & Sunny": ["scorching", "blistering", "incandescent"],
    "Hot & Humid": ["sweltering", "dripping", "clammy"],
    "Hot & Windy": ["baking", "scorched", "blown"],
    "Hot & Overcast": ["stifling", "smothered", "oppressive"],
    "Hot & Dry": ["searing", "arid", "wilted"],
    
    // Warm weather conditions
    "Warm & Sunny": ["radiant", "sun-kissed", "glowing"],
    "Warm & Breezy": ["golden", "buoyant", "airy"],
    "Warm & Cloudy": ["hazy", "soft-lit", "mellow", "dreamy"],
    "Warm & Rainy": ["muggy", "steamy", "weighed"],
    "Warm & Humid": ["sticky", "clinging", "dense"],
    
    // Mild weather conditions
    "Mild & Sunny": ["crisp", "breezy", "temperate"],
    "Mild & Cloudy": ["muted", "dimmed", "softened"],
    "Mild & Breezy": ["gentle", "coasting", "billowing"],
    "Mild & Windy": ["flutter", "tossed", "dancing"],
    
    // Cool weather conditions
    "Cool & Rainy": ["melancholy", "dreary", "drab", "smeared"],
    "Cool & Windy": ["brisk", "nipping", "gusted"],
    
    // Cold weather conditions
    "Cold & Rainy": ["soggy", "biting", "icy"],
    "Cold & Sunny": ["frosted", "sun-dappled", "glinting"],
    "Cold & Overcast": ["bleak", "dim", "hushed"],
    "Cold & Windy": ["raw", "piercing", "windburned"],
    
    // Special conditions
    "Rain + Fog": ["drowned", "shrouded", "blurred"],
    "Fog & Calm": ["veiled", "misted", "blank"],
    "Thunderstorm": ["electric", "crackling", "volatile"],
    "Snowing Lightly": ["delicate", "powdered", "frosting"],
    "Snowing Heavily": ["blanketed", "smothered", "buried"],
    "Wind + Snow": ["whipped", "lashed", "stinging"],
    "Wind Only": ["swept", "buffeted", "rattled"],
    "Gusty": ["howling", "roaring", "whistling"],
    "Any + Low Visibility": ["opaque", "murky", "diffused"],
    "Cloudy All Day": ["somber", "gloomy", "dull"],
    "Sudden Rain or Cold": ["jarring", "shocking", "surprising"],
    "Dense Fog": ["shrouded", "impenetrable", "ghostly"],
    "Wild Mix of Conditions": ["chaotic", "turbulent", "unpredictable"]
};

/**
 * Determines the temperature category based on Fahrenheit temperature
 * @param {number} temperature Temperature in Fahrenheit
 * @returns {string} Temperature category (Hot, Warm, Mild, Cool, Cold)
 */
function getTemperatureCategory(temperature) {
    if (temperature >= 85) {
        return "Hot";
    } else if (temperature >= 65) {
        return "Warm";
    } else if (temperature >= 45) {
        return "Mild";
    } else if (temperature >= 32) {
        return "Cool";
    } else {
        return "Cold";
    }
}

/**
 * Maps an API weather condition to our internal condition category
 * @param {string} condition API weather condition (Clear, Clouds, Rain, etc.)
 * @param {number} temperature Temperature in Fahrenheit (for snow conditions)
 * @returns {string} Internal condition category
 */
function mapWeatherCondition(condition, temperature) {
    // Map API weather conditions to our categories
    const conditionMap = {
        "Clear": "Sunny",
        "Clouds": "Cloudy",
        "Rain": "Rainy",
        "Drizzle": "Rainy",
        "Thunderstorm": "Thunderstorm",
        "Snow": temperature <= 20 ? "Snowing Heavily" : "Snowing Lightly",
        "Mist": "Fog & Calm",
        "Fog": "Fog & Calm",
        "Haze": "Fog & Calm",
        "Dust": "Any + Low Visibility",
        "Sand": "Any + Low Visibility",
        "Ash": "Any + Low Visibility",
        "Squall": "Gusty",
        "Tornado": "Wild Mix of Conditions",
        "Smoke": "Any + Low Visibility"
    };
    
    // Return mapped condition or default to Sunny if unknown
    return conditionMap[condition] || "Sunny";
}

/**
 * Get the appropriate vibe word based on weather conditions
 * @param {number} temperature Temperature in Fahrenheit
 * @param {string} condition Weather condition (Clear, Clouds, Rain, etc.)
 * @param {Object} weatherData Additional weather data for special cases
 * @returns {string} The appropriate vibe word
 */
function getVibeWord(temperature, condition, weatherData) {
    // Default vibe word in case no match is found
    const defaultVibe = "Ambient";
    
    // Get temperature category
    const tempCategory = getTemperatureCategory(temperature);
    
    // Get condition category
    const conditionCategory = mapWeatherCondition(condition, temperature);
    
    console.log(`Looking for vibe word for: ${tempCategory} & ${conditionCategory} (${temperature}°F, ${condition})`);
    
    // Check for special wind conditions
    const isWindy = weatherData && weatherData.windSpeed > 10;
    
    // Special case handling for wind combinations
    if (isWindy) {
        // Try to find wind-specific vibe for this temperature
        const windyMatch = `${tempCategory} & Windy`;
        if (vibeWordMap[windyMatch]) {
            const options = vibeWordMap[windyMatch];
            const randomVibe = options[Math.floor(Math.random() * options.length)];
            console.log(`Found windy match: ${randomVibe} for ${windyMatch}`);
            return randomVibe;
        }
        
        // Try generic wind conditions
        if (condition === "Snow") {
            if (vibeWordMap["Wind + Snow"]) {
                const options = vibeWordMap["Wind + Snow"];
                const randomVibe = options[Math.floor(Math.random() * options.length)];
                console.log(`Found snow+wind match: ${randomVibe}`);
                return randomVibe;
            }
        }
        
        // Just wind
        if (conditionCategory === "Sunny" && vibeWordMap["Wind Only"]) {
            const options = vibeWordMap["Wind Only"];
            const randomVibe = options[Math.floor(Math.random() * options.length)];
            console.log(`Found wind-only match: ${randomVibe}`);
            return randomVibe;
        }
        
        // Gusty
        if (weatherData.windSpeed > 15 && vibeWordMap["Gusty"]) {
            const options = vibeWordMap["Gusty"];
            const randomVibe = options[Math.floor(Math.random() * options.length)];
            console.log(`Found gusty match: ${randomVibe}`);
            return randomVibe;
        }
    }
    
    // Check for fog + rain combination
    if ((condition === "Rain" || condition === "Drizzle") && 
        (weatherData && weatherData.description && 
         (weatherData.description.includes("fog") || weatherData.description.includes("mist")))) {
        if (vibeWordMap["Rain + Fog"]) {
            const options = vibeWordMap["Rain + Fog"];
            const randomVibe = options[Math.floor(Math.random() * options.length)];
            console.log(`Found rain+fog match: ${randomVibe}`);
            return randomVibe;
        }
    }
    
    // Check for density of fog - if visibility is very low
    if (condition === "Fog" || condition === "Mist" || condition === "Haze") {
        // Check for dense fog
        if (weatherData && weatherData.description && 
            weatherData.description.includes("dense")) {
            if (vibeWordMap["Dense Fog"]) {
                const options = vibeWordMap["Dense Fog"];
                const randomVibe = options[Math.floor(Math.random() * options.length)];
                console.log(`Found dense fog match: ${randomVibe}`);
                return randomVibe;
            }
        }
    }
    
    // Try exact match first (e.g., "Hot & Sunny")
    const exactMatch = `${tempCategory} & ${conditionCategory}`;
    if (vibeWordMap[exactMatch]) {
        const options = vibeWordMap[exactMatch];
        const randomVibe = options[Math.floor(Math.random() * options.length)];
        console.log(`Found exact match: ${randomVibe} for ${exactMatch}`);
        return randomVibe;
    }
    
    // Try special condition matches (e.g., "Thunderstorm", "Snowing Lightly")
    if (vibeWordMap[conditionCategory]) {
        const options = vibeWordMap[conditionCategory];
        const randomVibe = options[Math.floor(Math.random() * options.length)];
        console.log(`Found condition match: ${randomVibe} for ${conditionCategory}`);
        return randomVibe;
    }
    
    // Try partial matches - e.g., any condition with this temperature category
    const tempMatches = Object.keys(vibeWordMap).filter(key => key.startsWith(`${tempCategory} &`));
    if (tempMatches.length > 0) {
        // Pick a random temperature-matched condition
        const randomConditionKey = tempMatches[Math.floor(Math.random() * tempMatches.length)];
        const options = vibeWordMap[randomConditionKey];
        const randomVibe = options[Math.floor(Math.random() * options.length)];
        console.log(`Found temp category match: ${randomVibe} for ${randomConditionKey}`);
        return randomVibe;
    }
    
    console.log(`No match found, returning default: ${defaultVibe}`);
    return defaultVibe;
}

// Export functions and data for use in other files
window.VibeUtils = {
    getVibeWord,
    getTemperatureCategory,
    mapWeatherCondition
};
