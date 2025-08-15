'use strict';

const btn = document.querySelector('.btn-country');
const countriesContainer = document.querySelector('.countries');

// NEW COUNTRIES API URL (use instead of the URL shown in videos):
// https://restcountries.com/v2/name/portugal

// NEW REVERSE GEOCODING API URL (use instead of the URL shown in videos):
// https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}

function renderError(error) {
    countriesContainer.insertAdjacentText("beforeend", error);
};

/**
 * Create an Asynchronous AJAX call (old way) and retrieve data from a country.
 * Create an HTML element for the fetched data.
 * @param {string} country data to be fetched
 */
function getCountryData(country) {
    const request = new XMLHttpRequest();
    request.open("GET", `https://restcountries.com/v2/name/${country}`);
    request.send();
    // Asynchronous load event. The function inside the handler is called after data is loaded
    request.addEventListener("load", function() {
        // JSON String Object
        const jsonObject = this.responseText; // "this" = request
        // Destructure array, instead of doing: JSON.parse(jsonObject)[0]
        const [data] = JSON.parse(jsonObject);
        // Render the HTML element
        renderCountry(data);
    });
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
}
// getCountryData("italy");
// getCountryData("gb");
// getCountryData("switzerland");

// const request = new XMLHttpRequest();
// request.open("GET", `https://restcountries.com/v2/name/${country}`);
// request.send();


// Modern Way - ES6 Promise: placeholder for the AJAX call
// const request = fetch(`https://restcountries.com/v2/name/italy`);
// console.log(request);

/**
 * Create an Asynchronous AJAX call (ES6: Promise) and retrieve data from a country.
 * Create an HTML element for the fetched data.
 * @param {string} country data to be fetched
 */
function getCountryDataPromise(country) {
    // Generate a promise with "fetch"
    fetch(`https://restcountries.com/v2/name/${country}`)
    // consuming promise with "then" generated from fetch
    .then((response) => response.json()) // Read the data returning a new promise
    // consuming promise with "then" generated from json()
    .then((data) => renderCountry(data[0])); // call the renderCountry method with the data
};
// getCountryDataPromise("italy");

/**
 * Create an Asynchronous AJAX call (ES6: Promise) and retrieve data from a 
 * country and its neighbours. Create an HTML element for the fetched data.
 * @param {string} country data to be fetched
 */
function getCountryDataAndNeighbour(country) {
    // Country
    // Generate a promise with "fetch"
    fetch(`https://restcountries.com/v2/name/${country}`)
    // consuming promise with "then" generated from fetch
    .then(response => response.json()) // Read the data returning a new promise
    // consuming promise with "then" generated from json()
    .then(data => {
        renderCountry(data[0]); // call the renderCountry method with the data
        const neighbour = data[0].borders?.[0]; // optional chaining for countries with no borders property
        if (!neighbour) return;
        // Neighbour
        // Generate a new promise with "fetch" for the neighbour
        return fetch(`https://restcountries.com/v2/alpha/${neighbour}`) // return the fullfilled value
    })
    // consuming promise with "then" generated from fetch neighbour
    .then(response => response.json()) // Read the data returning a new promise
    // consuming promise with "then" generated from json()
    .then(data => renderCountry(data)) // call the renderCountry method with the data
    // It triggers the transition animation
    .finally(() => countriesContainer.style.opacity = 1); // shows the container
};
// getCountryDataAndNeighbour("italy");
// getCountryDataAndNeighbour("gb");

/**
 * Create an Asynchronous AJAX call (ES6: Promise) and retrieve data from a 
 * country and its neighbours. Call recursiveNeighbours for all neighbours
 * @param {string} country data to be fetched
 */
function getCountryDataAndNeighbourRecursive(country) {
    // Country
    getJSON(`https://restcountries.com/v2/name/${country}`, `Country not found`)
        // consuming promise with "then" generated from json()
        .then(data => {
            renderCountry(data[0]); // call the renderCountry method with the data
            const neighbours = data[0]?.borders; 
            if (!neighbours) throw new Error("Neighbour not found");
            // Call the recursive function for all the neighbours in country
            return recursiveNeighbours(neighbours, neighbours.length - 1);
        })
        .catch(error => {
            console.error(error); 
            // Display the error message on the page
            renderError(`Something went wrong ${error.message}. Try again!`);
        })
        // This event happens all the time at the end of the promise
        // It triggers the transition animation
        .finally(() => countriesContainer.style.opacity = 1); // shows the container
};

/**
 * Create an HTML element for each neighbour
 * @param {Array} neighbours of the country
 * @param {number} n number of neighbours in base 0
 * @returns null
 */
function recursiveNeighbours(neighbours, n) {
    // Neighbour
    if (n < 0) return Promise.resolve(); // base case
    return getJSON(`https://restcountries.com/v2/alpha/${neighbours[n]}`, `Neighbour not found`)
        // consuming promise with "then" generated from json()
        .then(data => {
            renderCountry(data, "neighbour"); // call the renderCountry method with the data
            recursiveNeighbours(neighbours, n - 1);
        })
        .catch(error => {
            // handling connection error for neighbour
            console.error(`Error fetching neighbour (${neighbours[n]}):`, error);
            renderError(`Something went wrong ${error.message}. Try again!`);
            // Propagate the error and stop recursion
            throw error;
        });
};

/**
 * Get data from the REST Countries API 
 * @param {string} url to send to the API for retrieving the data
 * @param {string} errorMsg - message to be sent if response is not ok
 * @returns a new promise
 */
function getJSON(url, errorMsg) {
    // Generate a new promise with "fetch"
    return fetch(url)
    // consuming promise with "then" generated from fetch
    .then(response => {
        // If the country is not found
        if (!response.ok) throw new Error(`${errorMsg} (${response.status})`); // it passes the response.status and the string to the catch block
        // Read the data returning a new promise
        return response.json();
    });
};
// getCountryDataAndNeighbourRecursive("australia");
// getCountryDataAndNeighbourRecursive("italy");
// location.reload();
// getCountryDataAndNeighbourRecursive("spain");
// location.reload();
/*********************************************************************** Coding Challenge # 1 ******************************************************************/
/* 
In this challenge you will build a function 'whereAmI' which renders a country ONLY based on GPS coordinates. For that, you will use a second API to geocode coordinates.

Here are your tasks:

PART 1
1. Create a function 'whereAmI' which takes as inputs a latitude value (lat) and a longitude value (lng) (these are GPS coordinates, examples are below).
2. Do 'reverse geocoding' of the provided coordinates. Reverse geocoding means to convert coordinates to a meaningful location, like a city and country name. Use this API to do reverse geocoding: https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}.
The AJAX call will be done to a URL with this format: https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=52.508&longitude=13.381. Use the fetch API and promises to get the data. Do NOT use the getJSON function we created, that is cheating 😉
3. Once you have the data, take a look at it in the console to see all the attributes that you recieved about the provided location. Then, using this data, log a messsage like this to the console: 'You are in Berlin, Germany'
4. Chain a .catch method to the end of the promise chain and log errors to the console
5. This API allows you to make only 3 requests per second. If you reload fast, you will get this error with code 403. This is an error with the request. Remember, fetch() does NOT reject the promise in this case. So create an error to reject the promise yourself, with a meaningful error message.

PART 2
6. Now it's time to use the received data to render a country. So take the relevant attribute from the geocoding API result, and plug it into the countries API that we have been using.
7. Render the country and catch any errors, just like we have done in the last lecture (you can even copy this code, no need to type the same code)

TEST COORDINATES 1: 52.508, 13.381 (Latitude, Longitude)
TEST COORDINATES 2: 19.037, 72.873
TEST COORDINATES 2: -33.933, 18.474

GOOD LUCK 😀
*/
function whereAmI(lat, lng) {
    // Generate a promise with "fetch"
    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}`)
    // consuming promise with "then" generated from json()
        .then(response => {
            // if you reloaded too fast for more than 3 times, throw an error with a string, response status, and status text. This will be caught in the catch method
            if (response.status === 403) throw new Error(`This API allows you to make only 3 requests per second, try later. Error: ${response.status} - ${response.statusText}`); 
            // if response is not ok throw an error with a string, response status, and status text. This will be caught in the catch method
            if (!response.ok) throw new Error(`Country not found, try again. Error: ${response.status} - ${response.statusText}`);
            return response.json(); // Read the data returning a new promise
        })
        // consuming promise with "then" generated from json()
        .then(data => {
            console.log(data);
            console.log(`You are in ${data.city}, ${data.countryName}`);
            // getCountryDataAndNeighbourRecursive(data.countryName);
            // getCountryDataAndNeighbour(data.countryCode);
            getCountryDataAndNeighbour(data.countryName);
        })
        // catch the thrown error and print the message on the console and webpage
        .catch(error => {
            console.error(error);
            countriesContainer.insertAdjacentText("beforeend", error);
            countriesContainer.style.opacity = 1;
        });  
};
// whereAmI(53.0219008, -2.21184);
// whereAmI(-33.933, 18.474);
// whereAmI(232342342342, 234234234);
// whereAmI(52.508, 13.381);
// whereAmI(35.8617, 104.1954);
/************************************************************* The Event Loop - JS behind the scenes **************************************************************/
/*
Code outside callback functions will run first, so the 2 synchronous logs will run first, line 242 and 246.
The callback inside the Promise will runs then, as it will be added in the Microtask queue and take priority.
The callback inside the timer will runs then, as Callback queue runs after Microtask queue. So the time in the timer is not garanteed as Microtask queues can take longer and have all the time priority, no matter how many callback there are inside.
*/
/*
console.log("Test start");
setTimeout(()=> console.log("0 sec timer"), 0);
// Create a promise that will resolve immediately
Promise.resolve("Resolved promise 1").then((response)=> console.log(response));
Promise.resolve("Resolved promise 2").then((response)=> {
    for (let i=0; i < 1000000000; i++) {}
    console.log(response)
});
console.log("Test end");
*/
/**************************************************************** Building promises ********************************************************************************/
/*
// Build the promise
const lotteryPromise = new Promise(function(resolve, reject) { // Promise's executor function takes two functions as its arguments
    // Promise's executor function
    if (Math.random() >= 0.5) { // Random generates a number between 0 and 1
        // fulfill state
        resolve("You WON 💰"); // whatever we pass inside the resolve function, it will be the result when it is handled with the "then" method
    } else {
        // reject state
        reject("You lost your money 💩"); // whatever we pass inside the reject function, it will be the error that we want to catch later with the handler
    };
});
// Consume the promise
lotteryPromise.then(result => console.log(result)).catch(error => console.error(error));


// Build the promise simulating the asynchronous behaviour
const lotteryPromiseAsync = new Promise(function(resolve, reject) { // Promise's executor function takes two functions as its arguments
    // Promise's executor function
    console.log("Lottery draw is happening 🔮");
    // timer
    setTimeout(function() {
        // Promise's executor function
        if (Math.random() >= 0.5) { // Random generates a number between 0 and 1
            // fulfill state
            resolve("You WON 💰"); // whatever we pass inside the resolve function, it will be the result when it is handled with the "then" method
        } else {
            // reject state
            reject(new Error("You lost your money 💩")); // create a new error inside the reject function. it will be catched with the handler
        };
    }, 2000);
});
// Consume the promise
lotteryPromiseAsync.then(result => console.log(result)).catch(error => console.error(error));

/**
 * Promisifying setTimeout.
 * Converting a function that uses callbacks (setTimeout) into a function that returns a Promise.
 * @param {number} seconds to wait before resolving the promise 
 * @returns a resolved promise, with no value, after tot seconds
 */
function wait(seconds) {
    return new Promise(function(resolve) { // We don't need the reject function as the timer will never fail
        setTimeout(resolve, seconds * 1000) // resolve the promise after some seconds, without passing any value
    });
};
/*
// Consume the promise
wait(4).then(() => console.log("I waited for 4 seconds"));

// Consume the promise
wait(5).then(() => {
    console.log("I waited for 5 seconds");
    // Chaining another promise
    return wait(1);
})
.then(() => console.log("I waited for another second"));

// Resolving immediately a Promise
Promise.resolve("Immediately Promise Resolving").then(result => console.log(result));
// Rejecting immediately a Promise
Promise.reject(new Error("Immediately Promise Rejecting")).catch(result => console.error(result));

// The asynchronous Geolocation API take 2 callback functions as parameters, success and fails.
navigator.geolocation.getCurrentPosition(
    data => console.log(data),
    error => console.log(error)
);
*/

/**
 * Promisifying geolocation
 * @returns a resolved promise, with the user's current gps coordinates
 */
function getPosition() {
    return new Promise(function(resolve, reject) {
        // navigator.geolocation.getCurrentPosition(
        // calls the resolve function with the data, if the promise is fulfilled
        // data => resolve(data),
        // calls the reject function with the error, if the promise is not fulfilled
        // error => reject(error)
        // );
        // Semplified, same as above. The two callback functions (resolve and reject) will be invoked automatically with the corresponding data as their parameters.
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
};
// getPosition().then(position => console.log(position));


function whereAmINow() {
    getPosition().then(position => {
        const {latitude: lat, longitude: lng} = position.coords;
        // Generate a promise with "fetch"
        return fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}`);
    })
    // consuming promise with "then" generated from json()
    .then(response => {
        // if you reloaded too fast for more than 3 times, throw an error with a string, response status, and status text. This will be caught in the catch method
        if (response.status === 403) throw new Error(`This API allows you to make only 3 requests per second, try later. Error: ${response.status} - ${response.statusText}`); 
        // if response is not ok throw an error with a string, response status, and status text. This will be caught in the catch method
        if (!response.ok) throw new Error(`Country not found, try again. Error: ${response.status} - ${response.statusText}`);
        return response.json(); // Read the data returning a new promise
    })
    // consuming promise with "then" generated from json()
    .then(data => {
        console.log(`You are in ${data.city}, ${data.countryName}`)
        getCountryDataAndNeighbourRecursive(data.countryCode);
    })
    // catch the thrown error and print the message on the console and webpage
    .catch(error => {
        console.error(error);
        countriesContainer.insertAdjacentText("beforeend", error);
        countriesContainer.style.opacity = 1;
    });  
};
// whereAmINow();

/**
 * Reverse geocoding: converts coordinates to a meaningful location
 * If latitude and longitude are empty then the user's current location is used.
 * @param {number} lat - latitude
 * @param {number} lng - longitude
 * @returns a Promise with the response of converting the coordinates 
 */
function whereAmINow2(lat, lng) {
    // Geocoding API address
    const apiAddress = function(lat, lng) {
        return fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}`);
    };
    if (lat === "" && lng === "") {
        return getPosition().then(position => {
            const {latitude, longitude} = position.coords;
            // Generate a promise with "fetch"
            return apiAddress(latitude, longitude);
        });
    } else {
        return apiAddress(lat, lng);
    };
};

/**
 * Fetch data for a country and all its neighboring countries, then 
 * generate an HTML element for the country and each of its neighbors.
 * @param {any} lat - latitude or empty string
 * @param {any} lng - longitude or empty string
 */
function consumeWhereAmINow(lat = "", lng = "") {
    // Returning a Promise with the response
    whereAmINow2(lat, lng)
    // consuming promise with "then" generated from json()
    .then(response => {
        // if you reloaded too fast for more than 3 times, throw an error with a string, response status, and status text. This will be caught in the catch method
        if (response.status === 403) throw new Error(`This API allows you to make only 3 requests per second, try later. Error: ${response.status} - ${response.statusText}`); 
        // if response is not ok throw an error with a string, response status, and status text. This will be caught in the catch method
        if (!response.ok) throw new Error(`Country not found, try again. Error: ${response.status} - ${response.statusText}`);
        return response.json(); // Read the data returning a new promise
    })
    // consuming promise with "then" generated from json()
    .then(data => {
        console.log(`You are in ${data.city}, ${data.countryName}`);
        // problem with countryName = "United Kingdom of Great Britain and Northern Ireland (the)" for UK coordinates
        data.countryName === "United Kingdom of Great Britain and Northern Ireland (the)"
        ? getCountryDataAndNeighbourRecursive(data.countryCode) 
        : getCountryDataAndNeighbourRecursive(data.countryName);
    })
    // catch the thrown error and print the message on the console and webpage
    .catch(error => {
        console.error(error);
        countriesContainer.insertAdjacentText("beforeend", error);
        countriesContainer.style.opacity = 1;
    }); 
};

// consumeWhereAmINow(); 
// consumeWhereAmINow(41.8719, 12.5674);
// consumeWhereAmINow(35.8617, 104.1954);
// consumeWhereAmINow(52.508, 13.381);
// consumeWhereAmINow(-33.933, 18.474);
/*************************************************************** Coding Challenge #2 *******************************************************************************/

/* 
Build the image loading functionality that I just showed you on the screen.

Tasks are not super-descriptive this time, so that you can figure out some stuff on your own. Pretend you're working on your own 😉

PART 1
1. Create a function 'createImage' which receives imgPath as an input. This function returns a promise which creates a new image (use document.createElement('img')) and sets the .src attribute to the provided image path. When the image is done loading, append it to the DOM element with the 'images' class, and resolve the promise. The fulfilled value should be the image element itself. In case there is an error loading the image ('error' event), reject the promise.

If this part is too tricky for you, just watch the first part of the solution.

PART 2
2. Comsume the promise using .then and also add an error handler;
3. After the image has loaded, pause execution for 2 seconds using the wait function we created earlier;
4. After the 2 seconds have passed, hide the current image (set display to 'none'), and load a second image (HINT: Use the image element returned by the createImage promise to hide the current image. You will need a global variable for that 😉);
5. After the second image has loaded, pause execution for 2 seconds again;
6. After the 2 seconds have passed, hide the current image.

TEST DATA: Images in the img folder. Test the error handler by passing a wrong image path. Set the network speed to 'Fast 3G' in the dev tools Network tab, otherwise images load too fast.

GOOD LUCK 😀
*/
const imageDiv = document.querySelector(".images");
let currentIMG;

/**
 * Creates a new image and sets the .src attribute to the provided image path
 * @param {string} imgPath 
 * @returns a Promise
 */
function createImage(imgPath) {
    return new Promise(function(resolve, reject) {
        const image = document.createElement("img");
        image.src = imgPath;

        image.onload = () => {
            imageDiv.append(image);
            resolve(image);
        };

        image.onerror = () => reject(new Error("Error loading image"));
    });
};

// createImage("img/img-1.jpg")
// .then(result => {
//     currentIMG = result;
//     return wait(2);
// })
// .then(()=> {
//     currentIMG.style.display = "none";
//     return wait(2);
// })
// .then(()=> {
//     return createImage("img/img-2.jpg");
// })
// .then(result => {
//     currentIMG = result;
//     return wait(2);
// })
// .then(()=> {
//     currentIMG.style.display = "none";
//     return wait(2);
// })
// .then(()=> {
//     return createImage("img/img-3.jpg");
// })
// .catch(error => console.error(error));

/**
 * Recursively call createImage n times.
 * Display an image for 2 seconds and hide it after other 2 seconds.
 * Keep the first one on display.
 * The image src is updated only after it has fully loaded, utilizing 
 * asynchronous behavior. The timer begins only at that moment. 
 * @param {number} n number of images in the img folder
 * @returns undefined (Promised resolved)
 */
function loadThreeIMG(n) {
    if (n <= 0) return Promise.resolve();
    
    // Create the element and show for 2 seconds
    return createImage(`img/img-${n}.jpg`)
        .then(result => {
            currentIMG = result;
            return wait(2);
        })
        .then(()=> {
            // Hide the image after 2 seconds but keeps the first one on the page 
            if (n !== 1) {
                currentIMG.style.display = "none";
                return wait(2);
            };  
        })
        // call recursive
        .then(()=>  loadThreeIMG(n-1))
        // catch error
        .catch(error => {
            console.error(error);
            // Propagate the error and stop recursion
            throw error;
        });        
};
// loadThreeIMG(3);
/************************************************************* Consuming Promise with Async/Await **************************************************************/
// Consuming Promise with "then"
// function getCountryDataAndNeighbour(country) {
//     // Country
//     // Generate a promise with "fetch"
//     fetch(`https://restcountries.com/v2/name/${country}`)
//     // consuming promise with "then" generated from fetch
//     .then(response => response.json()) // Read the data returning a new promise
//     // consuming promise with "then" generated from json()
//     .then(data => {
//         renderCountry(data[0]); // call the renderCountry method with the data
//         const neighbour = data[0].borders?.[0]; // optional chaining for countries with no borders property
//         if (!neighbour) return;
//         // Neighbour
//         // Generate a new promise with "fetch" for the neighbour
//         return fetch(`https://restcountries.com/v2/alpha/${neighbour}`) // return the fullfilled value
//     })
//     // consuming promise with "then" generated from fetch neighbour
//     .then(response => response.json()) // Read the data returning a new promise
//     // consuming promise with "then" generated from json()
//     .then(data => renderCountry(data)) // call the renderCountry method with the data
//     // It triggers the transition animation
//     .finally(() => countriesContainer.style.opacity = 1); // shows the container
// };

// Consuming Promise with "await"
// "await" can only be used inside an async function
async function whereAmIAsync(country) {
    // Promise: Wait and store the fulfilled promise value
    try {
        const result = await fetch(`https://restcountries.com/v2/name/${country}`);
        // if response is not ok throw an error with a string, response status, and status text. This will be caught in the catch method
        if (!result.ok) throw new Error(`Country not found, try again. Error: ${result.status}`);
        // Promise: Wait and store the json converted data
        const data = await result.json();
        // render the country
        renderCountry(data[0]); // call the renderCountry method with the data
        countriesContainer.style.opacity = 1; // shows the container
    } catch(error) {
        console.error(`Error: ${error.message} in whereAmIAsync handled correctly`);
    };
};
// whereAmIAsync("Italy");

// Consuming Promise with "then"
// function whereAmINow() {
//     getPosition().then(position => {
//         const {latitude: lat, longitude: lng} = position.coords;
//         // Generate a promise with "fetch"
//         return fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}`);
//     })
//     // consuming promise with "then" generated from json()
//     .then(response => {
//         // if you reloaded too fast for more than 3 times, throw an error with a string, response status, and status text. This will be caught in the catch method
//         if (response.status === 403) throw new Error(`This API allows you to make only 3 requests per second, try later. Error: ${response.status} - ${response.statusText}`); 
//         // if response is not ok throw an error with a string, response status, and status text. This will be caught in the catch method
//         if (!response.ok) throw new Error(`Country not found, try again. Error: ${response.status} - ${response.statusText}`);
//         return response.json(); // Read the data returning a new promise
//     })
//     // consuming promise with "then" generated from json()
//     .then(data => {
//         console.log(`You are in ${data.city}, ${data.countryName}`)
//         getCountryDataAndNeighbourRecursive(data.countryCode);
//     })
//     // catch the thrown error and print the message on the console and webpage
//     .catch(error => {
//         console.error(error);
//         countriesContainer.insertAdjacentText("beforeend", error);
//         countriesContainer.style.opacity = 1;
//     });  
// };
// whereAmINow();

// Consuming Promise with "await"
async function whereAmINowAsync() {
    try {
        // Promise: Get user location coordinates
        const position = await getPosition();
        // Destructures latitude and longitude from the coordinates
        const {latitude: lat, longitude: lng} = position.coords;
        // Promise: Geo locate the user with its coordinates
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}`);
        // if you reloaded too fast for more than 3 times, throw an error with a string, response status, and status text. This will be caught in the catch method
        if (response.status === 403) throw new Error(`This API allows you to make only 3 requests per second, try later. Error: ${response.status} - ${response.statusText}`); 
        // if response is not ok throw an error with a string, response status, and status text. This will be caught in the catch method
        if (!response.ok) throw new Error(`Country not found, try again. Error: ${response.status} - ${response.statusText}`);
        // Promise: Convert the response to a json object
        const dataGeo = await response.json();
        // Get country data
        await whereAmIAsync(dataGeo.countryCode);
        // Return message
        return `You are in ${dataGeo.city}, ${dataGeo.countryName}`;
    } catch(error) {
        console.error(`Error: ${error.message} in whereAmINowAsync`);
        // Propagate the error to be handled below in the IIF
        throw error;
    };
};
// whereAmINowAsync();
// console.log(whereAmINowAsync()); // async function always returns a promise
/*
// Immediate invoked function (IIF)
(async function() {
    try {
        const message = await whereAmINowAsync();
        console.log(message);
    } catch(error) {
        console.error(`Error: ${error.message} in IIF handled correctly`)
    }
    console.log("Async function completed");
})();
/************************************************************ Try and Catch ***********************************************************************************/
// try {
//     let y = 3;
//     const x = 5;
//     x = 8
// } catch(error) {
//     console.log(new Error(error.message));
// };
/************************************************* Running Promises in parallel - Promise.all ***********************************************************************/
// Promise.all short ciurcuits when a promise reject

// Testing sequential and parallel
/*
async function runSequential() {
  console.time('sequential');
  await wait(1);
  await wait(1);
  await wait(1);
  console.timeEnd('sequential');
}

async function runParallel() {
  console.time('parallel');
  await Promise.all([wait(1), wait(1), wait(1)]);
  console.timeEnd('parallel');
}

(async () => {
  await runSequential();
  await runParallel();
})();
*/

// Array function: returns the REST Countries url address for the country passed as parameter
const urlAddress = country => `https://restcountries.com/v2/name/${country}`;

async function get3CountriesSequential(c1, c2, c3) {
    try {
        // Running in sequence
        console.time('sequential'); 

        const [data1] = await getJSON(urlAddress(c1));
        const [data2] = await getJSON(urlAddress(c2));
        const [data3] = await getJSON(urlAddress(c3));
        console.log([data1.capital, data2.capital, data3.capital]);

        console.timeEnd('sequential');
    } catch(error) {
        console.error(error.message);
    }
};
async function get3CountriesParallel(c1, c2, c3) {
    try {
        //Running in parallel
        console.time('parallel');

        const data = await Promise.all([getJSON(urlAddress(c1)), getJSON(urlAddress(c2)), getJSON(urlAddress(c3))]);
        console.log(data);
        console.log(data.map(country => country[0].capital));

        console.timeEnd('parallel');
    } catch(error) {
        console.error(error.message);
    }
};

/*
(async () => {
    await get3CountriesSequential("italy", "gb", "spain");
    await get3CountriesParallel("italy", "gb", "spain");
})();
*/
/****************************************************************** Promise Race ********************************************************************************/
/*
// Return the result of the fastest settled Promise, either fulfilled or rejected
(async ()=> {
    const result = await Promise.race([
    getJSON(urlAddress("italy")),
    getJSON(urlAddress("gb")),
    getJSON(urlAddress("spain")),
    ]);
  console.log(result[0]);
})();
*/

//Timer for reject a Promise
function timeOut(seconds) {
    return new Promise((_, reject) => setTimeout(()=> reject(new Error("Request took too long!")), seconds * 1000));
};

/**
 * Asincronus IIF.
 * Give the promise a maximum allowed time to resolve.
 * The first promise race with the timeOut Promise.
 * If the promise will not resolve within the 5 seconds in the timer, then
 * the promise will be rejected with error: Request took too long!
 */
/*
(async ()=> {
    try {
        const result = await Promise.race([
        // first promise
        getJSON(urlAddress("italy")),
        // promise that reject after 5 seconds
        timeOut(5), // try with 0.1 seconds probably it will fail
    ]);
    console.log(result[0]);
    } catch(error) {
        console.log(error.message);
    }
})();
/****************************************************** Promise allSettled - It never short circuit *****************************************************************/
// Promise.allSettled returns the result from all the promises (fulfilled and rejected)
/*
(async ()=> {
    try {
        const result = await Promise.allSettled([
            Promise.resolve("Success"), 
            Promise.reject("ERROR"),
            Promise.resolve("Another success"),     
        ]);
        console.log(result);
    } catch(error) {
        console.log(error.message);
    }
})();

// Promise.all short circuit when a promise is rejected
(async ()=> {
    try {
        const result = await Promise.all([
            Promise.resolve("Success"), 
            Promise.reject("ERROR"),
            Promise.resolve("Another success"),     
        ]);
        console.log(result);
    } catch(error) {
        console.log(error);
    }
})();
/******************************************************************************* Promise.any **********************************************************************/
// Promise.any returns the first fulfilled promise, ignoring any rejected one
/*
(async ()=> {
    try {
        const result = await Promise.any([
            Promise.resolve("Success"), 
            Promise.reject("ERROR"),
            Promise.resolve("Another success"),     
        ]);
        console.log(result);
    } catch(error) {
        console.log(error);
    }
})();
/********************************************************************** Coding Challenge #3 ********************************************************************/
/* 
PART 1
Write an async function 'loadNPause' that recreates Coding Challenge #2, this time using async/await (only the part where the promise is consumed). Compare the two versions, think about the big differences, and see which one you like more.
Don't forget to test the error handler, and to set the network speed to 'Fast 3G' in the dev tools Network tab.

PART 2
1. Create an async function 'loadAll' that receives an array of image paths 'imgArr';
2. Use .map to loop over the array, to load all the images with the 'createImage' function (call the resulting array 'imgs')
3. Check out the 'imgs' array in the console! Is it like you expected?
4. Use a promise combinator function to actually get the images from the array 😉
5. Add the 'paralell' class to all the images (it has some CSS styles).

TEST DATA: ['img/img-1.jpg', 'img/img-2.jpg', 'img/img-3.jpg']. To test, turn off the 'loadNPause' function.

GOOD LUCK 😀
*/

/**
 * async/await function. Recursively call createImage n times.
 * Display an image for 2 seconds and hide it after other 2 seconds.
 * Keep the first one on display.
 * The image src is updated only after it has fully loaded, utilizing 
 * asynchronous behavior. The timer begins only at that moment. 
 * @param {number} n number of images in the img folder
 * @returns undefined (Promised resolved)
 */
async function loadNPause(n) {
    if (n <= 0) return Promise.resolve();
    try {
        const image = await createImage(`img/img-${n}.jpg`);
        await wait(2);
        // Hide the image after 2 seconds but keeps the first one on the page 
        if (n !== 1) {
            image.style.display = "none";
            await wait(2);
        }; 
        await loadNPause(n-1);
    } catch(error) {
        console.error(error);
    }
};
// loadNPause(3);

// async function loadAll(imgArr) {
//     try {
//         const imgs = imgArr.map(async img => await createImage(img));
//         const result = await Promise.all(imgs);
//         result.forEach(img => img.classList.add("parallel"));
//     } catch(error) {
//         console.error(error);
//     }
    
// };

// loadAll(['img/img-1.jpg', 'img/img-2.jpg', 'img/img-3.jpg']);

async function loadAll(imgArr) {
    try {
        const imgs = imgArr.map(img => createImage(img));
        const result = await Promise.allSettled(imgs);
        result.forEach(img => {
            if (img.status === "fulfilled") img.value.classList.add("parallel");
            else console.log(`Image not found ${img.reason}`);           
        });
    } catch {
        console.error();
    } 
};
loadAll(['img/img-1.jpg', 'img/img-2.jpg', 'img/img-3.jpg']);

