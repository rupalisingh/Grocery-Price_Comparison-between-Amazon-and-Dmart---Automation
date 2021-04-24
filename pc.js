let puppeteer = require("puppeteer")
let {items} = require("./items")
let {credential} = require("./credentials")
let links = ["https://www.dmart.in/", "https://www.amazon.in/"];

(async function () {
    try {
        let browserInstance = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ["--start-maximized",]
        });

        
        let dmarttab = await logindmart(links[0], browserInstance)
        let amazontab = await loginamazon(links[1], browserInstance)
        for(let i = 0; i<items.length; i++){
            let itemobj = items[i]
            let itemname = itemobj.name
            let dmartresult = await searchdmart(dmarttab,itemname)
            let amazonresult = await searchamazon(amazontab, itemname)
            // (dmarconsole.logtresult)
            // console.log(amazonresult)
            await waitAndClick("#nav-logo-sprites", amazontab, {delay : 800})
            await pricecomparison(dmartresult, amazonresult, dmarttab, amazontab)
         }
    }catch (err) {
        console.log(err);
    }
})();

async function logindmart(url, browserInstance){
    let newtab = await browserInstance.newPage();
    await newtab.setDefaultNavigationTimeout(0)
    let credobj = credential[0]
    await newtab.setDefaultNavigationTimeout(0); 
    await newtab.goto(url);
    await watiAndtype(".jss9", "410206", newtab, {delay : 400})
    await waitAndClick("li button", newtab, {delay : 400})
    await newtab.keyboard.press("Enter")
    await waitAndClick(".src-client-components-pincode-widget-__pincode-widget-module___success-cntr [type]", newtab, {delay : 400})
    await waitAndClick("button[title = 'SignIn']", newtab)
    await newtab.waitForTimeout(5000); 
    await watiAndtype("input[name='mobileNumber']", credobj.mobile, newtab, {delay : 800})
    await watiAndtype("input[name='password']", credobj.pass, newtab, {delay : 800})
    await waitAndClick(".src-client-components-auth-__common-module___loginForm .MuiButton-label", newtab, {delay : 400})
    //console.log(newtab)
    
    return newtab

}

async function loginamazon(url, browserInstance){

    let newtab = await browserInstance.newPage();
    await newtab.setDefaultNavigationTimeout(0); 
    let credobj = credential[1]
    
    await newtab.goto(url,{
        waiUntil : 'load',
        timeout : 0
    });
    await newtab.click(".nav-line-1-container")
    await watiAndtype("input[type = 'email']", credobj.mobile, newtab, {delay : 800})
    await waitAndClick(".a-button-input", newtab, {delay : 800})
    await watiAndtype("input[type = 'password']", credobj.pass, newtab, {delay : 800})
    await waitAndClick(".a-button-input", newtab, {dealy : 800})
    await waitAndClick("#nav-logo-sprites", newtab, {delay : 800})
    return newtab

}

async function searchdmart(newtab, itemname){
    await watiAndtype("#scrInput", itemname, newtab, {delay : 1000})
    await waitAndClick("Button.MuiButton-containedPrimary", newtab, {delay : 1000})
    await newtab.waitForTimeout(3000)
    await newtab.waitForNavigation()
    //await newtab.waitForSelector(".src-client-components-product-card-vertical-card-__vertical-card-module___card-vertical", {visible : true})
    let itemdetailarr = []
    let name = await newtab.evaluate(() => document.querySelectorAll("a.src-client-components-product-card-vertical-card-__vertical-card-module___title")[0].innerText)
    let price = await newtab.evaluate(() => document.querySelectorAll(".src-client-components-product-card-vertical-card-__vertical-card-module___price-container")[1].innerText.split(" ")[1])
    let item_availability = true
    if(await newtab.evaluate(()=> document.querySelectorAll(".src-client-components-product-card-vertical-card-__vertical-card-module___section-top")[0].innerText == "")){
        item_availability = true
    }else{
        item_availability = false
    }
    itemdetailarr = [
        {
            name, price, item_availability
        }
    ]
    //console.log(name, price, item_availability)
    return itemdetailarr

}

async function searchamazon(newtab, itemname){

    await watiAndtype("#twotabsearchtextbox", itemname, newtab, {delay : 5000})
    await waitAndClick("#nav-search-submit-button", newtab, {delay : 5000})
    await newtab.waitForTimeout(2000)
    await newtab.waitForSelector("h2.a-size-mini.a-spacing-none.a-color-base.s-line-clamp-4", {visible : true})
    // list of all the items on that page
    function getitem(listofitems){
        let allitemslength = document.querySelectorAll(listofitems).length
        let itemstag = document.querySelectorAll(listofitems)
        let allitemsarr = []
        for(let i = 0; i<allitemslength; i++){
        let iteritem = itemstag[i].innerText.trim()
        allitemsarr.push(iteritem)
        }

        return allitemsarr
    }    
    let allitemsinpage = await newtab.evaluate(getitem,'.a-size-base-plus.a-color-base.a-text-normal')
    //console.log(allitemsinpage)
    let index = await IfitemIspresent(allitemsinpage, itemname)
    let itemdetailarr = []
    let name = itemname
    if(index == -1){
        item_availability = false
        price = Number.MAX_VALUE
    }else{
        function togetprice(priceselector, index){
            let allpricearr = document.querySelectorAll(priceselector)
            let getprice = allpricearr[index].innerText
            return getprice
        }
        price = await newtab.evaluate(togetprice, ".a-price-whole", index)
        // console.log(price)
        item_availability = true
    }
    itemdetailarr.push({
        name, price, item_availability, index
    })

    return itemdetailarr
}

async function IfitemIspresent(allitemsinpage, itemname){
    let namequantsplitarr = itemname.split(",")
    let itemnameonly = namequantsplitarr[0].trim().toLowerCase()
    let itemquantonly = namequantsplitarr[1].trim()
    itemquantonly = itemquantonly.split(" ")[0]
    for(let i = 0; i<allitemsinpage.length; i++){
        let name = allitemsinpage[i].split(',')[0]
        let newname = name.toLowerCase()
        let quant = allitemsinpage[i].split(',')[1]
        if(newname.includes(itemnameonly) && quant.includes(itemquantonly)){
            // console.log("Item found" + i)
            return i
        }else{
            // console.log("Item not found")
            return -1
        }
    }
    
}

async function pricecomparison(dmartresult, amazonresult, dmarttab, amazontab){
    let dmartobj = dmartresult[0]
    let amazonobj = amazonresult[0]
    if(dmartobj.price < amazonobj.price && dmartobj.item_availability == true){
        console.log("Dmart best price")
        pushcartdmart(dmartresult, dmarttab)
    }else if(dmartobj.price > amazonobj.price && amazonobj.item_availability == true){
        console.log("Amazon best price")
        pushcartamazon(amazonresult, amazontab)
    }
}

async function pushcartdmart(dmartresult, newtab){
    function getfirstitembutton(AddtocartSelector){
        let allAddtocartbutton = document.querySelectorAll(AddtocartSelector)
        let firstaddtocartbutton = allAddtocartbutton[0]
        return firstaddtocartbutton
    }
    let addtocartbutton = await newtab.evaluate(getfirstitembutton,".src-client-components-product-card-cart-action-__cart-action-module___action-label")
    await waitAndClick(addtocartbutton, newtab)
}

async function pushcartamazon(amazonresult, newtab){

    let obj = amazonresult[0]
    let getindex = obj.index
    function getitem(itemselector, getindex){
        let allitemarr = document.querySelectorAll(itemselector)
        console.log(allitemarr)
        let selecteditem = allitemarr[getindex]
        console.log(selecteditem)
        return selecteditem
    }

    let getitemresult = await newtab.evaluate(getitem, ".a-size-base-plus.a-color-base.a-text-normal", getindex)
    console.log(getitemresult)
    await waitAndClick(getitemresult, newtab)
    await waitAndClick("#add-to-cart-button", newtab)
}

async function waitAndClick(selector, newtab){
    await newtab.waitForSelector(selector, {visible : true})
    let clickpromise = newtab.click(selector)
    return clickpromise
}


async function watiAndtype(selector, input, newtab){
    await newtab.waitForSelector(selector, {visible : true})
    let typepromise = await newtab.type(selector, input)
    return typepromise
}
