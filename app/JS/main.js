//Imports
import '../CSS/style.css';
import * as nbt from 'prismarine-nbt';
import {Buffer} from 'buffer';
import pako from 'pako';
import { decode } from 'punycode';



//Important Variables
const apiKey = import.meta.env.VITE_HYPIXEL_API_KEY;
const search_form =  document.querySelector(".search_form");
const auctions_container =  document.querySelector(".auctions_container")
const item_info_dispay = document.querySelector(".item_info_display")
const pageNavigation =  document.querySelector(".page_scroller");
const minecraftFormattingCodes = {
    "§0":"color:#000000;", // Black
    "§1":"color:#0000AA;", // Dark Blue
    "§2":"color:#00AA00;", // Dark Green
    "§3":"color:#00AAAA;", // Dark Aqua
    "§4":"color:#AA0000;", // Dark Red
    "§5":"color:#AA00AA;", // Dark Purple
    "§6":"color:#FFAA00;", // Gold
    "§7":"color:#AAAAAA;", // Gray
    "§8":"color:#555555;", // Dark Gray
    "§9":"color:#5555FF;", // Blue
    "§a":"color:#55FF55;", // Green
    "§b":"color:#55FFFF;", // Aqua
    "§c":"color:#FF5555;", // Red
    "§d":"color:#FF55FF;", // Light Purple
    "§e":"color:#FFFF55;", // Yellow
    "§f":"color:#FFFFFF;", // White
    "§g":"color:#DDD605;", // Minecoin Gold (BE only)
    "§h":"color:#E3D4D1;", // Material Quartz (BE only)
    "§i":"color:#CECACA;", // Material Iron (BE only)
    "§j":"color:#443A3B;", // Material Netherite (BE only)
    "§m":"color:#971607;", // Material Redstone (BE only)
    "§n":"color:#B4684D;", // Material Copper (BE only)
    "§p":"color:#DEB12D;", // Material Gold (BE only)
    "§q":"color:#47A036;", // Material Emerald (BE only)
    "§s":"color:#2CBAA8;", // Material Diamond (BE only)
    "§t":"color:#21497B;", // Material Lapis (BE only)
    "§u":"color:#9A5CC6;",  // Material Amethyst (BE only)
    "§k": "font-family: 'Courier New', Courier, monospace; animation: obfuscate 1s infinite;", // Obfuscated
    "§l": "font-weight: bold;", // Bold
    "§m": "text-decoration: line-through;", // Strikethrough
    "§n": "text-decoration: underline;", // Underline
    "§o": "font-style: italic;", // Italic
    "§r": "all: unset; font: inherit;", // Reset
    "§z": ""
  
};
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




//Load the general auctionData
const resourcemap = {};
let auctionData;
const auctionByUUID={};
const auctionElements=[];
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
async function load_website()
{
    await getItemData();
    const auction_data =  await load_data();
    for (const auction of Object.values(auction_data.auctions)) {
        await processAuctionData(auction);
    }
}
async function processAuctionData(auctionData)
{   
    const itemData =  auctionData.item_bytes;
    const decodedItemData = await decodeGzipped(itemData);
    const importantDataArray = decodedItemData.value.i.value.value;
        
    // Iterate over the array using for...of
    for (const item of importantDataArray) {
        const actuallyImportant = item.tag.value;
        console.log(actuallyImportant);
        
        const id = actuallyImportant.ExtraAttributes.value.id.value;
        await displayItems(id, auctionData, actuallyImportant);
    }
}
async function displayItems(itemID, auctionData, itemData)//Might refactor this later
{
    let itemImage =  getItemImage(itemID, auctionData);    
    if(!itemImage)
    {
        try{
            itemImage = fetchHead(itemData.SkullOwner.value.Properties.value.textures.value.value[0].Value.value);
        }
        catch(error)
        {
            console.error(error);
            console.log("NULL ITEM");
            return;
        }
            //Backup thingie 
    }//Issues  =  ZOMBIE AND SKELETON SKULLS, 
    if(itemData.ench)
    {
        //Apply enchantment glint here    
    }
    auctionElements.push(`
        <div class="auction_item" data-uuid="${auctionData.uuid}">
            <h2 class="item_header">${auctionData.item_name}</h2>
            <img src="${itemImage}" class="item_image"alt="${auctionData.item_name}">
            <h2>Auctioneer : }</h2>
            <h2>Starting Bid : ${abbreviateItem(auctionData.starting_bid)}</h2>
            <h2>Start : ${EpochToDate(auctionData.start)} End : ${EpochToDate(auctionData.end)}</h2>
            <h2></h2>
        </div>
        `)
    console.log("ELEMENT WAS PUSHED")
    //Gonna replace with new system
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
async function start()
{
    await load_website();
    console.log("Starting execution")
    navigateToPage(page_number)
    console.log(auctionElements)
    console.log(auctionElements.length)

}
start()


//Page scrolling functionality
const item_amount = 1000 //will replace with method to get total items;
const item_per_page =  25;
let page_number = 1; //Gonna be the default page number
const total_pages =  Math.ceil(item_amount/item_per_page);
function navigateToPage(page)
{
    if(page<=0|| page>total_pages)
    {
        page_number = page<=0?1:total_pages;
        return;
    }
    auctions_container.innerHTML="";
    for(let i = (page*item_per_page)-item_per_page;i<page*item_per_page;i++)
    {
        auctions_container.insertAdjacentHTML("beforeend", auctionElements[i]);
    }
}

const stupid_form = document.querySelector(".page_form");
stupid_form.addEventListener("submit", function(event)
{
    event.preventDefault()
    console.log("Something was done")
    const clickedButton = event.submitter.value;
    console.log(clickedButton)
    if(clickedButton == "previous"){page_number-=1;}else if(clickedButton == "next"){page_number+=1};
    navigateToPage(page_number)
})






//Displays indepth information
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
function isEmptyOrWhitespace(str) {
    return str.trim().length === 0;
}
function assign_properties(str){
    const parts = str.split(/(?=§[0-9a-f])/);
    const propertyMap = {}
    console.log(parts)
    const find_formatsymbol =  /§/g;
    const regex_check =  /^\s*$/;
    for(let i;i<parts.length;i++)
    {
        if(isEmptyOrWhitespace(parts[i]))
        {
            console.log("REGEXCHECK DTETECTEd")
            continue;
        }
        console.log(parts[i])
        if((parts[i].length/parts[i].match(find_formatsymbol).length) == 2)
        {
            parts[i]=parts[i]+parts[i+1]
            parts.splice(i+1,1)
            i-=1;
        }
    }
    for(let b=0;b<parts.length;b++)
    {
        if(isEmptyOrWhitespace(parts[b]))
        {
            console.log("REGEXCHECK DTETECTEd", parts[b], parts)
            continue;
        }
        const startIndex = parts[b].match(find_formatsymbol).length *2
        propertyMap[parts[b].slice(startIndex)] = parts[b].slice(0, startIndex);
    }
    apply_properties(propertyMap);
}
function apply_properties(list)
{
    const element_list = [];
    let new_element =  `<span style="`
    for(const[key,value] of Object.entries(list))
    {
        console.log(key,value);
        for(let i=0;i<(value.length/2);i++)
        {
            const style = minecraftFormattingCodes[value.slice(i*2,i*2+2)];
            new_element+=style;
        }
        new_element+=`">${key}</span>`
        element_list.push(new_element);
        new_element=`<span style="`
    }
    console.log(element_list)
    element_list.forEach(item=>
    {
        item_info_dispay.insertAdjacentHTML("beforeend",`${item}`)
    }
    )
    item_info_dispay.insertAdjacentHTML("beforeend","<br>")

}
async function loadAuctionItemData(itemInfo)
{
    const decodedData =  await decodeGzipped(itemInfo)
    const lore =  decodedData.value.i.value.value[0].tag.value.display.value.Lore.value.value;
    const name =  decodedData.value.i.value.value[0].tag.value.display.value.Name.value.value;
    console.log(lore)
    item_info_dispay.textContent="";
    lore.forEach(line=>
    {
        if(!line)
        {
            item_info_dispay.insertAdjacentHTML("beforeend","<br>")
            return;
        }
        assign_properties(line) 
    }
    )    
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





//Part 2 stuff
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
        console.log(dehashed);
        return dehashed; 
    }
    catch(error)
    {
        console.error("problem fetching player data", error);
    }
}