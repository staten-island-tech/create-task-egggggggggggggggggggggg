import '../CSS/style.css';
import * as nbt from 'prismarine-nbt';
import {Buffer} from 'buffer';
import pako from 'pako';
import { decode } from 'punycode';
const apiKey = import.meta.env.VITE_HYPIXEL_API_KEY;
const search_form =  document.querySelector(".search_form");
const auctions_container =  document.querySelector(".auctions_container")
const item_info_dispay = document.querySelector(".item_info_display")



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
    const player_auction_data =  await getData(`https://api.hypixel.net/v2/skyblock/auction?key=${apiKey}&player=${playerUUID}`)
    return player_auction_data
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
async function get_minecraft_player_data(player_uuid)
{
    try{
        const cleanedPlayerUuid =  player_uuid.replace(/-/g,"")
        const playerNameResponse =  await getData(`https://sessionserver.mojang.com/session/minecraft/profile/${cleanedPlayerUuid}`);
        const dehashed =  JSON.parse(atob(playerNameResponse));
        console.log(dehashed)
        return dehashed; 
    }
    catch(error)
    {
        console.error("problem fetching player data", error);
    }
}
function EpochToDate(epoch)
{
    const date =  new Date(epoch);
    return date.toString();
}
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
const resourcemap = {};
async function getItemData()
{
    try{
        const resourcesResponse =  await getData('https://api.hypixel.net/v2/resources/skyblock/items');
        resourcesResponse.items.forEach(item => {
            if(!resourcemap[item.id])
            {
                resourcemap[item.id] = [];
            }
            resourcemap[item.id].push(item)
        
        });
    }
    catch(error)
    {
        console.error(error,"ERROR");
    }
}
let auctionData;
const auctionByUUID={};
async function load_data()
{
    auctionData = await getData('https://api.hypixel.net/v2/skyblock/auctions', "FAILED TO RETRIEVE AUCTION");
    if(!auctionData)
    {
        return error;
    }
        auctionData.auctions.forEach(auction=>
            {
                auctionByUUID[auction.uuid]=[];
                auctionByUUID[auction.uuid].push(auction);
            }
        ) 
    return auctionData;
}
async function displayItems(itemID, auctionData, itemData)
{
    let itemImage =  getItemImage(itemID, auctionData);    
    console.log(auctionData)
    if(!itemImage)
    {
        itemImage = fetchHead(itemData.SkullOwner.value.Properties.value.textures.value.value[0].Value.value);

        //Backup thingie 
    }//Issues  =  ZOMBIE AND SKELETON SKULLS, 
    if(itemData.ench)
    {
        //Apply enchantment glint here    
    }
    auctions_container.insertAdjacentHTML("beforeend",`
        <div class="auction_item" data-uuid="${auctionData.uuid}">
            <h2 class="item_header">${auctionData.item_name}</h2>
            <img src="${itemImage}" class="item_image"alt="${auctionData.item_name}">
            <h2>Auctioneer : }</h2>
            <h2>Starting Bid : ${auctionData.starting_bid}</h2>
            <h2>Start : ${EpochToDate(auctionData.start)} End : ${EpochToDate(auctionData.end)}</h2>
            <h2></h2>
        </div>
        `)
    
}
async function decodeGzipped(Gzipped)
{
    try{
        const data =  Buffer.from(Gzipped, 'base64');
        const decompressed =  pako.ungzip(data);
        const buffer =  Buffer.from(decompressed);
        return new Promise((resolve, reject)=>
        {
            nbt.parse(buffer,(error, result)=>
            {
                if(error)
                {
                    reject(error);
                } else{
                    resolve(result);
                }
            })
        })
    }
    catch(error){
        return error;
    }
}
function getItemImage(image_name)
{
    try{
        if(!resourcemap[image_name])
        {
            return false;
        }
        const item_data = resourcemap[image_name][0];
        const item_material =  item_data.material;
        let item_image = item_material == "SKULL_ITEM" ? fetchHead(item_data.skin.value) : `valid_images/minecraft_${item_material.toLowerCase()}.png`;
        if(!item_image)
        {
            item_image = item_material.split(":")[0];
        }
        return item_image;
    }
    catch(error)
    {
        console.error(error, image_name, "Issue detected");
    }
}
async function load_website()
{
    await getItemData();
    const auction_data =  await load_data();
    auction_data.auctions.forEach(auction=>
        {
            processAuctionData(auction);
        }
    )

}
function processAuctionData(auctionData)
{   
    const itemData =  auctionData.item_bytes;
    const decodedItemData = decodeGzipped(itemData);
    decodedItemData.then(data=>
        {
            const actuallyImportant  =  data.value.i.value.value[0].tag.value;
            const id =  actuallyImportant.ExtraAttributes.value.id.value;
            displayItems(id, auctionData, actuallyImportant);
}   
)  
}
load_website()
auctions_container.addEventListener("click",(event)=>
{
    const clicked =  event.target.closest(".auction_item");
    if(clicked!=null)
    {
        const auction_uuid = clicked.dataset.uuid
        loadAuctionItemData(auctionByUUID[auction_uuid][0].item_bytes)
        //Item info display thingie
    }
})



async function loadAuctionItemData(itemInfo)
{
    const decodedData =  await decodeGzipped(itemInfo)
    console.log(decodedData.value.i.value.value[0].tag.value.display)
    item_info_dispay.textContent =  decodedData.value.i.value.value[0].tag.value.display;
}


//Implement a page function to reduce screen thingie

//Create an array for auctionData
//get the items name. check it with the auctionData dictionary 
//Check for item.bytes to get the info on the item
//get auctioneer and pass it through a function to get that player's skin.
//Add a live timer ig


//Work on finishing searchbar
//Take searchbar info and pass t
//Utilize auction uuid 