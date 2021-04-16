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
        getlistingdmart(links[0], browserInstance)
        getlistingamazon(links[1], browserInstance)
         
    } catch (err) {
        console.log(err);
    }
})();

async function getlistingdmart(url, browserInstance){
    let newtab = await browserInstance.newPage();
    let credobj = credential[0]
    await newtab.setDefaultNavigationTimeout(0); 
    await newtab.goto(url);
    await newtab.waitForSelector(".jss9")
    await newtab.type(".jss9", "410206")
    //await newtab.waitForSelector("li button")
    await waitAndClick("li button", newtab)
    await newtab.keyboard.press("Enter")
    //await newtab.waitForSelector(".src-client-components-pincode-widget-__pincode-widget-module___success-cntr [type]")
    await waitAndClick(".src-client-components-pincode-widget-__pincode-widget-module___success-cntr [type]", newtab)
    await waitAndClick("button[title = 'SignIn']", newtab)
    await newtab.waitForSelector("input[name='password']")
    await newtab.type("input[name='mobileNumber']", credobj.mobile, {delay : 5000})
    await newtab.type("input[name='password']", credobj.pass)
    await waitAndClick(".src-client-components-auth-__common-module___loginForm .MuiButton-label", newtab)

}

async function getlistingamazon(url, browserInstance){
    let newtab = await browserInstance.newPage();
    let credobj = credential[1]
    await newtab.setDefaultNavigationTimeout(0); 
    await newtab.goto(url);
    await newtab.click(".nav-line-1-container")
    await newtab.waitForSelector("#ap_email")
    await newtab.type("#ap_email", credobj.mobile, {delay : 200})
    //await newtab.click(".a-row.a-size-base-plus.a-grid-vertical-align.a-grid-center")
    await newtab.click(".a-button-input")
    await newtab.waitForSelector("#ap_email")
    await newtab.type(".a-input-text.a-span12.auth-autofocus.auth-required-field", credobj.pass, {delay : 200})
    await newtab.click(".a-button-input")
    

    
}

async function waitAndClick(selector, newtab){
    await newtab.waitForSelector(selector)
    let clickpromise = newtab.click(selector)
    return clickpromise
}
