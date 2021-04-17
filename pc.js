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
        // console.log(dmarturl, amazonurl)
        for(let i = 0; i<items.length; i++){
            let itemobj = items[i]
            let itemname = itemobj.name
            let dmartresult = await searchdmart(dmarttab, browserInstance,itemname)
            let amazonresult = await searchamazon(amazontab, browserInstance, itemname)
            //console.log("dmart - > ", dmartresult)
            //console.log("amazon -> ", amazonresult)
            if(dmartresult[1] > amazonresult[1] && amazonresult[2] == true){
                console.log("add cart to amazon")
                pushcartamazon(newtab, itemname, itemindex)
            }else if(dmartresult[1] < amazonresult[1] && dmartresult[2] == true){
                console.log("add cart to dmart")
                pushcartdmart(newtab, itemname)
            }    
        }
    }catch (err) {
        console.log(err);
    }
})();

async function logindmart(url, browserInstance){
    let newtab = await browserInstance.newPage();
    let credobj = credential[0]
    await newtab.setDefaultNavigationTimeout(0); 
    await newtab.goto(url);
    await watiAndtype(".jss9", "410206", newtab)
    //await newtab.waitForSelector("li button")
    await waitAndClick("li button", newtab)
    await newtab.keyboard.press("Enter")
    //await newtab.waitForSelector(".src-client-components-pincode-widget-__pincode-widget-module___success-cntr [type]")
    await waitAndClick(".src-client-components-pincode-widget-__pincode-widget-module___success-cntr [type]", newtab)
    await waitAndClick("button[title = 'SignIn']", newtab)
    await newtab.setDefaultNavigationTimeout(0); 
    await watiAndtype("input[name='mobileNumber']", credobj.mobile, newtab)
    await watiAndtype("input[name='password']", credobj.pass, newtab)
    await waitAndClick(".src-client-components-auth-__common-module___loginForm .MuiButton-label", newtab)
    
    return newtab.url()

}

async function loginamazon(url, browserInstance){

    let newtab = await browserInstance.newPage();
    let credobj = credential[1]
    await newtab.setDefaultNavigationTimeout(0); 
    await newtab.goto(url);
    await newtab.click(".nav-line-1-container")
    await watiAndtype("input[type = 'email']", credobj.mobile, newtab)
    //await newtab.click(".a-row.a-size-base-plus.a-grid-vertical-align.a-grid-center")
    await waitAndClick(".a-button-input", newtab)
    await watiAndtype("input[type = 'password']", credobj.pass, newtab)
    await waitAndClick(".a-button-input", newtab, {dealy : 500})
    await waitAndClick("#nav-logo-sprites", newtab, {delay : 500})
    //console.log(newtab.url())
    return newtab.url();

}

async function searchdmart(url, browserInstance, itemname){
    let newtab = await browserInstance.newPage()
    await newtab.goto(url)
    await watiAndtype("#scrInput", itemname, newtab)
    await waitAndClick(".src-client-components-header-components-search-__search-module___searchButton.MuiButton-containedPrimary", newtab)
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

async function searchamazon(url, browserInstance, itemname){
    //console.log(url)
    let newtab = await browserInstance.newPage()
    await newtab.goto(url)
    await watiAndtype("#twotabsearchtextbox", itemname, newtab)
    await waitAndClick("#nav-search-submit-button", newtab)
    await newtab.waitForSelector("h2.a-size-mini.a-spacing-none.a-color-base.s-line-clamp-4", {visible : true})
    let itemindex = await searchselecteditemamazon("h2.a-size-mini.a-spacing-none.a-color-base.s-line-clamp-4", itemname, newtab)
    if(itemindex == -1){
        // pass max value 
        item_availability = false
        itemprice = Number.MAX_VALUE;
        itemdetailarr = [{
            itemname, itemprice, item_availability, itemindex
        }]
         return itemdetailarr
    }else{
        let itemname = newtab.evaluate(() => document.querySelectorAll("h2.a-size-mini.a-spacing-none.a-color-base.s-line-clamp-4")[itemindex].innerText)
        let itemprice = newtab.evaluate(() => document.querySelectorAll(".a-price-whole")[itemindex].innerText)
        let item_availability = true
        let itemdetailarr = [{
            itemname, itemprice, item_availability, itemindex
        }]

         return itemdetailarr
    }
    
   

}

async function searchselecteditemamazon(selector, itemname, newtab){
        await newtab.evaluate((itemname) => {
        let allitemslength = document.querySelectorAll(".a-size-base-plus.a-color-base.a-text-normal").length
        console.log(allitemslength)
        for(i = 0; i<allitemslength; i++){
        let iteritem = document.querySelectorAll(".a-size-base-plus.a-color-base.a-text-normal")[i].innerText
        console.log(iteritem)
        if(iteritem.includes(itemname)){
            return i
        }
    }    
    });
    
    return -1
}

async function pushcartdmart(newtab, itemname){
    await waitAndClick(".src-client-components-product-card-vertical-card-__vertical-card-module___action-container", newtab)
}

async function pushcartamazon(newtab, itemname, itemindex){
    let getelem = await document.querySelectorAll("h2.a-size-mini.a-spacing-none.a-color-base.s-line-clamp-4")[i].innerText
    await waitAndClick(getelem, newtab)
    await waitAndClick("#add-to-cart-button")
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
