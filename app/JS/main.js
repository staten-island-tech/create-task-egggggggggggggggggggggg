import '../CSS/style.css';

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
function getItemImage()
{

}
//Function for getting item image.
//Check item within id hash map and cross reference that 
async function getData(url)
{
    try{
        const response = await fetch(url);
        const data = await response.json();
        return data;
    }
    catch(error)
    {
        console.error("PROBLEM FETCHING DATA", error);
    }
}
let bazaarData;
async function load_data()
{
    bazaarData =  await getData('https://api.hypixel.net/v2/skyblock/auctions');
    for(const [item_name, details]  of Object.entries(bazaarData.auctions))
    {
        console.log(details);
    }
    console.log(Object.keys(bazaarData.auctions).length)
}
load_data();

//Data updates every minute\

async function getPlayerUUID(player_name)
{
    try
    {
        const uuidResponse =  await getData(`https://api.ashcon.app/mojang/v2/user/${player_name}`);
        return uuidResponse;
    }
    catch(error)
    {
        console.error("Problem fetching player UUID", error);
    }
}