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
    "§0": "color:#000000;", 
    "§1": "color:#0000AA;", 
    "§2": "color:#00AA00;",
    "§3": "color:#00AAAA;", 
    "§4": "color:#AA0000;", 
    "§5": "color:#AA00AA;",
    "§6": "color:#FFAA00;", 
    "§7": "color:#AAAAAA;", 
    "§8": "color:#555555;", 
    "§9": "color:#5555FF;", 
    "§a": "color:#55FF55;", 
    "§b": "color:#55FFFF;", 
    "§c": "color:#FF5555;", 
    "§d": "color:#FF55FF;", 
    "§e": "color:#FFFF55;", 
    "§f": "color:#FFFFFF;", 
    "§g": "color:#DDD605;", 
    "§h": "color:#E3D4D1;", 
    "§i": "color:#CECACA;", 
    "§j": "color:#443A3B;", 
    "§m": "color:#971607;", 
    "§n": "color:#B4684D;", 
    "§p": "color:#DEB12D;", 
    "§q": "color:#47A036;", 
    "§s": "color:#2CBAA8;", 
    "§t": "color:#21497B;", 
    "§u": "color:#9A5CC6;",  
    "§k": "font-family: 'Courier New', Courier, monospace; animation: obfuscate 1s infinite;", 
    "§l": "font-weight: bold;", 
    "§m": "text-decoration: line-through;", 
    "§n": "text-decoration: underline;", 
    "§o": "font-style: italic;", 
    "§r": "all: unset; font: inherit;", 
    "§z": ""
};

function abbreviateItem(number) {
    if (number < 1000) return Math.round(number.toString());
    const units = ["K", "M", "B", "T"]; 
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
function EpochToDate(epoch) {
    const date = new Date(epoch);
    const month = date.getMonth() + 1;  
    const day = date.getDate();
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;  
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
        end:EpochToDate(auctionData.end),
    }
    console.log(auctionData)
    console.log(auctionData.start, auctionData.end)
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
const page_input =  document.querySelector(".page_input")
function navigateToPage(page)
{
    if(page<=0|| page>total_pages)
    {
        page_number = page<=0?1:total_pages;
        return;
    }
    page_input.value = page;
    auctions_container.innerHTML="";
    console.log(auctionElements)
    for(let i = (page*item_per_page)-item_per_page;i<page*item_per_page;i++)
    {
        auctions_container.insertAdjacentHTML("beforeend", 
    `       <div class="auction_item" data-uuid="${auctionElements[i].uuid}">
                <h2 class="item_header">${auctionElements[i].item_name}</h2>
                <img src="${auctionElements[i].image}" class="item_image"alt="${auctionElements[i].item_name}">
                <h2>Starting Bid : ${auctionElements[i].normal_bid}</h2>
                <h2>Start : ${auctionElements[i].start}</h2>
                <h2>End : ${auctionElements[i].end}</h2>
                <h2></h2>
            </div>`
        );
        console.log(auctionElements[i])
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
page_input.addEventListener('keydown', (event)=>
{
    if(event.key === `Enter`)
    {
        event.preventDefault();
        const currentPage =  page_input.value  
        if(currentPage>total_pages)
        {
            page_input.value =  total_pages; 
            page_number =  total_pages;
            navigateToPage(total_pages)
        }
        else if(currentPage<=0)
        {
            page_input.value = 1;
            page_number =  1;
            navigateToPage(1)    
        }
        else
        {
            navigateToPage(currentPage)
        }
    }
})




auctions_container.addEventListener("click",(event)=>
{
    const clicked =  event.target.closest(".auction_item");
    if(clicked!=null)
    {
        const auction_uuid = clicked.dataset.uuid
        loadAuctionItemData(auctionByUUID[auction_uuid][0], auction_uuid)
    }
})
function isEmptyOrWhitespace(str) {
    return str.trim().length === 0;
}
function assign_properties(str){
    const parts = str.split(/(?=§[0-9a-f])/);
    const propertyMap = {}
    const find_formatsymbol =  /§/g;
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
    console.log(propertyMap)
    apply_properties(propertyMap);
}
function apply_properties(list)
{
    const element_list = [];
    let new_element =  `<span class="item_description" style="`
    for(const[key,value] of Object.entries(list))
    {
        for(let i=0;i<(value.length/2);i++)
        {
            const style = minecraftFormattingCodes[value.slice(i*2,i*2+2)];
            new_element+=style;
        }
        new_element+=`">${key}</span>`
        element_list.push(new_element);
        new_element=`<span class="item_description" style="`
    }
    element_list.forEach(item=>
    {
        item_info_dispay.insertAdjacentHTML("beforeend",`${item}`)
    }
    )
    item_info_dispay.insertAdjacentHTML("beforeend","<br>")

}
async function loadAuctionItemData(itemInfo, auction_uuid)
{
    const decodedData =  await decodeGzipped(itemInfo.item_bytes)
    const lore =  decodedData.value.i.value.value[0].tag.value.display.value.Lore.value.value;
    const name =  decodedData.value.i.value.value[0].tag.value.display.value.Name.value;
    item_info_dispay.textContent="";
    console.log(decodedData)
    console.log(auction_uuid)
    const itemPhoto =  document.querySelector(`.auction_item[data-uuid="${auction_uuid}"]`).querySelector("img").src
    console.log(itemPhoto)
    assign_properties(name)
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


