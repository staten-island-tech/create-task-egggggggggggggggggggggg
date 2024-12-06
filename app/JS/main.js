import '../CSS/style.css';

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

const bazaar_data = await getData('https://api.hypixel.net/v2/skyblock/bazaar');
console.log(bazaar_data);