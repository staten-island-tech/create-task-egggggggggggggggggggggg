import '../CSS/style.css';
const apiKey = import.meta.env.VITE_HYPIXEL_API_KEY;
const search_form =  document.querySelector(".search_form");
search_form.addEventListener("submit", (event)=>
{
    event.preventDefault()
    const player_name = document.querySelector(".player_input").value;
    if(player_name)
    {
        retrievePlayerAuctions(player_name)
    }
    console.log("Not a valid input")
})
async function retrievePlayerAuctions(player_name)
{
    const playerUUID =  await getPlayerUUID(player_name);
    const auction_data =  await getData(`https://api.hypixel.net/v2/skyblock/auction?key=${apiKey}&player=${playerUUID}`)
    console.log(auction_data)
}

function abbreviateItem(number) {
    if (number < 1000) return Math.round(number.toString());
    const units = ["k", "m", "b", "t"]; 
    const scale = Math.min(Math.floor(Math.log10(number) / 3), units.length); 
    const abbreviatedValue = number / Math.pow(1000, scale);
    return abbreviatedValue.toFixed(1) + (units[scale - 1] || "");
}
function fetchHead(Base64)
{
    Base64 =  JSON.parse(atob(Base64.replace(/\u003d/g,""))).textures.SKIN.url;
    Base64  = Base64.substring(Base64.lastIndexOf('/')+1);
    return(`https://mc-heads.net/head/${Base64}`)
}
async function getPlayerUUID(player_name)
{
    try
    {
        const uuidResponse =  await getData(`https://api.ashcon.app/mojang/v2/user/${player_name}`);
        return uuidResponse.uuid.replace(/-/g,"")

    }
    catch(error)
    {
        console.error("Problem fetching player UUID", error);
    }
}

//Function for getting item image.
//Check item within id hash map and cross reference that 
async function getData(url,error_message)
{
    try{
        const response = await fetch(url);
        const data = await response.json();
        return data;
    }
    catch(error)
    {
        console.error(error_message, error);
        throw error;
    }
}
let bazaarData;

function refresh_data()
{
    //When data is refreshed add it to a cache or smth
    load_data().then(data=>
    {

        data.auctions.forEach(auction=>
        {
            console.log(auction.start)
        }
        )
        const epochTime =  Date.now()
        console.log("current time", epochTime)
    })
    .catch(error=>{console.error("ERROR REFRESHING DATA", data)})

}
//Rrefresh data funct
refresh_data()
//Create condition to check whether item already exists within list or not. 
//Impelemnt use of proper caching to avoid strain
function displayItems()
{
    
}
//Get images
//Get the item price - Simple just use the data provided to us
//This is for displaying the regular stuff 

//Data updates every minute\
const resourcehashmap = {};
async function getItemData()
{
    try{
        const resourcesResponse =  await getData('https://api.hypixel.net/resources/skyblock/items');
        resourcesResponse.items.forEach(item => {
            if(!resourcehashmap[item.name])
            {
                resourcehashmap[item.name] = [];
            }
            resourcehashmap[item.name].push(item)
        });
        console.log(resourcehashmap)
        //Hash map by name instead, more efficent considering how the auction displays data
    }
    catch(error)
    {
        console.error(error,"ERROR");
    }
}
async function load_data()
{
   return await getData('https://api.hypixel.net/v2/skyblock/auctions', "FAILED TO RETRIEVE AUCTION");
}
getItemData()
function getItemImage(image_name)
{
    Promise.all()
    resourcehashmap[image_name];   
}
async function manual_update()
{

}

//Pull auction data
//Pull resource data 
//cache the resource data to avoid making multiple requests
//Make a cache for player_uuid ig 

//Call method to display item