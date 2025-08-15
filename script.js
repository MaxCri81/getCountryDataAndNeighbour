'use strict';
const countriesContainer = document.querySelector('.countries');

/**
 * Render the error on the webpage
 * @param {string} error to be rendered on the page
 */
function renderError(error) {
    countriesContainer.insertAdjacentText("beforeend", error);
};

/**
 * Create an HTML element for the fetched data object.
 * @param {Object} data returned from JSON.parse
 * @param {string} className CSS class name
 */
function renderCountry(data, className = "") {
    const html = `
    <article class="country ${className}">
        <img class="country__img" src="${data.flag}" />
        <div class="country__data">
            <h3 class="country__name">${data.name}</h3>
            <h4 class="country__region">${data.region}</h4>
            <p class="country__row"><span>👫</span>${(+data.population / 1_000_000).toFixed(1)}M people</p>
            <p class="country__row"><span>🗣️</span>${data.languages[0].name}</p>
            <p class="country__row"><span>💰</span>${data.currencies[0].name}</p>
        </div>
    </article>
    `;
    countriesContainer.insertAdjacentHTML("beforeend", html);
};

/**
 * Fetch JSON data asynchronously from the REST Countries API 
 * @param {string} url to send to the API for retrieving the data
 * @param {string} errorMsg - message to be sent if response is not ok
 * @returns {Object} Parsed JSON data.
 */
async function getJSON(url, errorMsg) {
    const response = await fetch(url);
    // If the country is not found
    if (!response.ok) throw new Error(`${errorMsg} (${response.status})`);
    // Read the data returning a new promise
    return response.json();
};

/**
 * Fetch country data and its neighbours sequentially and using async/await.
 * @param {string} country - The country name to fetch.
 */
async function getCountryDataAndNeighboursSequential(country) {
    try {
        console.time('sequential'); 
        // Country
        const [data] = await getJSON(`https://restcountries.com/v2/name/${country}`, `Country not found`);
        renderCountry(data); // call the renderCountry method with the data
        // Fetch neighbours if any
        const neighbours = data.borders; 
        if (!neighbours) throw new Error("No neighbours found");
        // Call fetchNeighbours function with all the neighbours in the country
        await fetchNeighboursSequential(neighbours);
        // Display the container
        countriesContainer.style.opacity = 1;
        console.timeEnd('sequential');
    } catch(error) {
        console.error(error.message);
        renderError(error.message);
    }    
};

/**
 * Fetch and render neighbouring countries.
 * @param {Array} neighbours - Array of border country codes.
 */
async function fetchNeighboursSequential(neighbours) {
    for (const neighbour of neighbours) {
        try {
            // Fetch neighbour
            const data = await getJSON(`https://restcountries.com/v2/alpha/${neighbour}`, `Neighbour not found`);
            renderCountry(data, "neighbour"); // call the renderCountry method with the data
        } catch(error) {
            console.error(`Error fetching neighbour (${neighbour}):`, error);
            renderError(`Something went wrong with neighbour (${neighbour}): ${error.message}`);
        }
    };
};
// getCountryDataAndNeighboursSequential("spain");

/**
 * Fetch country data and its neighbours in parallel using async/await.
 * @param {string} country - The country name to fetch.
 */
async function getCountryDataAndNeighboursParallel(country) {
    try {
        console.time('parallel'); 
        // Country
        const [data] = await getJSON(`https://restcountries.com/v2/name/${country}`, `Country not found`);
        renderCountry(data); // call the renderCountry method with the data
        // Fetch neighbours if any
        const neighbours = data.borders; 
        if (!neighbours || neighbours.length === 0) throw new Error("No neighbours found");
       // Fetch neighbours in parallel
        await fetchNeighboursParallel(neighbours);
        // Display the container
        countriesContainer.style.opacity = 1;
        console.timeEnd('parallel');
    } catch(error) {
        console.error(error.message);
        renderError(error.message);
    }    
};

/**
 * Fetch and render neighbouring countries in parallel.
 * @param {Array} neighbours - Array of border country codes.
 */
async function fetchNeighboursParallel(neighbours) {
    // Array of Promises
    const neighbourPromises = neighbours.map(neighbour => 
        getJSON(`https://restcountries.com/v2/alpha/${neighbour}`, `Neighbour not found`));

    const result = await Promise.allSettled(neighbourPromises);
    result.forEach(neighbour => {
        // Call renderCountry only if the promise if fulfilled
        if (neighbour.status === "fulfilled") {
            renderCountry(neighbour.value, "neighbour"); // call the renderCountry method with the data
        }
        else console.log(`Neighbour not found ${neighbour.reason}`);           
    });
};
// getCountryDataAndNeighboursParallel("spain");