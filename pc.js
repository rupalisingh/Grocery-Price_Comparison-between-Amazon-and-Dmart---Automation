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
            let dmartresult = await searchdmart(dmarttab, browserInstance,itemname)
            let amazonresult = await searchamazon(amazontab, browserInstance, itemname)
            await pricecomparison(dmartresult, amazonresult, browserInstance)
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
    await watiAndtype(".jss9", "410206", newtab, {delay : 400})
    await waitAndClick("li button", newtab, {delay : 400})
    await newtab.keyboard.press("Enter")
    await waitAndClick(".src-client-components-pincode-widget-__pincode-widget-module___success-cntr [type]", newtab, {delay : 400})
    await waitAndClick("button[title = 'SignIn']", newtab)
    await newtab.waitForTimeout(5000); 
    await watiAndtype("input[name='mobileNumber']", credobj.mobile, newtab, {delay : 800})
    await watiAndtype("input[name='password']", credobj.pass, newtab, {delay : 800})
    await waitAndClick(".src-client-components-auth-__common-module___loginForm .MuiButton-label", newtab, {delay : 400})
    
    return newtab.url()

}

async function loginamazon(url, browserInstance){

    let newtab = await browserInstance.newPage();
    let credobj = credential[1]
    await newtab.setDefaultNavigationTimeout(0); 
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
    return newtab.url();

}

async function searchdmart(url, browserInstance, itemname){
    let newtab = await browserInstance.newPage()
    await newtab.goto(url, {
        waiUntil : 'load',
        timeout : 0
    })
    await watiAndtype("#scrInput", itemname, newtab, {delay : 900})
    await waitAndClick(".src-client-components-header-components-search-__search-module___searchButton.MuiButton-containedPrimary", newtab, {delay : 500})
    await newtab.waitForTimeout(2000)
    await newtab.waitForSelector(".MuiGrid-grid-lg-auto.MuiGrid-grid-xl-auto", {visible : true})
    let itemdetailarr = []
    let name = await newtab.evaluate(() => document.querySelectorAll("a.src-client-components-product-card-vertical-card-__vertical-card-module___title")[0].innerText)
    let price = await newtab.evaluate(() => document.querySelectorAll(".src-client-components-product-card-vertical-card-__vertical-card-module___price-container")[1].innerText.split(" ")[1])
    let item_availability = true
    let curpageurl = newtab.url()
    if(await newtab.evaluate(()=> document.querySelectorAll(".src-client-components-product-card-vertical-card-__vertical-card-module___section-top")[0].innerText == "")){
        item_availability = true
    }else{
        item_availability = false
    }
    itemdetailarr = [
        {
            name, price, item_availability, curpageurl
        }
    ]
    //console.log(name, price, item_availability)
    return itemdetailarr

}

async function searchamazon(url, browserInstance, itemname){
    let newtab = await browserInstance.newPage()
    await newtab.goto(url, {
        waiUntil : 'load',
        timeout : 0
    })
    await watiAndtype("#twotabsearchtextbox", itemname, newtab, {delay : 200})
    await waitAndClick("#nav-search-submit-button", newtab, {delay : 200})
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
    let curpageurl = newtab.url()
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
        name, price, item_availability, curpageurl ,index
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

async function pricecomparison(dmartresult, amazonresult, browserInstance){
    let dmartobj = dmartresult[0]
    let amazonobj = amazonresult[0]
    if(dmartobj.price < amazonobj.price && dmartobj.item_availability == true){
        console.log("Dmart best price")
        pushcartdmart(dmartresult,browserInstance)
    }else if(dmartobj.price > amazonobj.price && amazonobj.item_availability == true){
        console.log("Amazon best price")
        pushcartamazon(amazonresult, browserInstance)
    }
}

async function pushcartdmart(dmartresult,browserInstance){
    let newtab = await browserInstance.newPage()
    await newtab.goto(dmartresult[0].curpageurl, {
        waiUntil : 'load',
        timeout : 0
    })
    await waitAndClick("[class] [class='MuiGrid-root MuiGrid-item MuiGrid-grid-xs-12 MuiGrid-grid-sm-6 MuiGrid-grid-md-4 MuiGrid-grid-lg-auto MuiGrid-grid-xl-auto']:nth-of-type(1) .src-client-components-product-card-vertical-card-__vertical-card-module___action-container [tabindex='0'] .MuiButton-label.jss28 .src-client-components-product-card-cart-action-__cart-action-module___action-label", newtab)
    await newtab.waitForTimeout(3000)
}

async function pushcartamazon(amazonresult, browserInstance){
    let newtab = await browserInstance.newPage()
    await newtab.goto(amazonresult[0].curpageurl, {
        waiUntil : 'load',
        timeout : 0
    })
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
