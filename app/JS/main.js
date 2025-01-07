import '../CSS/style.css';
import * as nbt from 'prismarine-nbt';
import {Buffer} from 'buffer';
import pako from 'pako';
import { decode } from 'punycode';
const apiKey = import.meta.env.VITE_HYPIXEL_API_KEY;
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
    for (const item of importantDataArray) {
        const actuallyImportant = item.tag.value;
        const id = actuallyImportant.ExtraAttributes.value.id.value;
        await displayItems(id, auctionData, actuallyImportant);
    }
}
async function displayItems(itemID, auctionData, itemData)
{
    let itemImage =  getItemImage(itemID, auctionData);    
    if(!itemImage)
    {
        try{
            itemImage = fetchHead(itemData.SkullOwner.value.Properties.value.textures.value.value[0].Value.value);
        }
        catch(error)
            {
                return;
            }
        }
        const auction =  {
        uuid:auctionData.uuid,
        item_name:auctionData.item_name,
        image:itemImage,
        normal_bid:abbreviateItem(auctionData.starting_bid),
        start:EpochToDate(auctionData.start),
        end:EpochToDate(auctionData.end)
    }
    auctionElements.push(auction);
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
    navigateToPage(page_number)
}
start()


const item_amount = 1000 
const item_per_page =  25;
let page_number = 1; 
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
        auctions_container.insertAdjacentHTML("beforeend", 
    `       <div class="auction_item" data-uuid="${auctionElements[i].uuid}">
                <h2 class="item_header">${auctionElements[i].item_name}</h2>
                <img src="${auctionElements[i].image}" class="item_image"alt="${auctionElements[i].item_name}">
                <h2>Auctioneer : }</h2>
                <h2>Starting Bid : ${abbreviateItem(auctionElements[i].starting_bid)}</h2>
                <h2>Start : ${auctionElements[i].start} End : ${auctionElements[i].end}</h2>
                <h2></h2>
            </div>`
        );
    }
}

const stupid_form = document.querySelector(".page_form");
stupid_form.addEventListener("submit", function(event)
{
    event.preventDefault()
    const clickedButton = event.submitter.value;
    if(clickedButton == "previous"){page_number-=1;}else if(clickedButton == "next"){page_number+=1};
    navigateToPage(page_number)
})






auctions_container.addEventListener("click",(event)=>
{
    const clicked =  event.target.closest(".auction_item");
    if(clicked!=null)
    {
        const auction_uuid = clicked.dataset.uuid
        loadAuctionItemData(auctionByUUID[auction_uuid][0])
    }
})
function isEmptyOrWhitespace(str) {
    return str.trim().length === 0;
}
function assign_properties(str){
    const parts = str.split(/(?=§[0-9a-f])/);
    const propertyMap = {}
    const find_formatsymbol =  /§/g;
    const regex_check =  /^\s*$/;
    for(let i;i<parts.length;i++)
    {
        if(isEmptyOrWhitespace(parts[i]))
        {
            continue;
        }
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
        for(let i=0;i<(value.length/2);i++)
        {
            const style = minecraftFormattingCodes[value.slice(i*2,i*2+2)];
            new_element+=style;
        }
        new_element+=`">${key}</span>`
        element_list.push(new_element);
        new_element=`<span style="`
    }
    element_list.forEach(item=>
    {
        item_info_dispay.insertAdjacentHTML("beforeend",`${item}`)
    }
    )
    item_info_dispay.insertAdjacentHTML("beforeend","<br>")

}
async function loadAuctionItemData(itemInfo)
{
    const decodedData =  await decodeGzipped(itemInfo.item_bytes)
    const lore =  decodedData.value.i.value.value[0].tag.value.display.value.Lore.value.value;
    const name =  decodedData.value.i.value.value[0].tag.value.display.value.Name.value.value;
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
    const auctioneerImage =  `https://skins.danielraybone.com/v1/render/body/${itemInfo.auctioneer}`
    item_info_dispay.insertAdjacentHTML("beforeend",`<img class="playerModelImage" src=${auctioneerImage}>`)
}



//Item info thingie