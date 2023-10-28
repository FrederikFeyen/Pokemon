import puppeteer from 'puppeteer';
import fs from 'fs';

// Scrape Windows
async function scrapewindows() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36');
  await page.goto('https://www.coolblue.be/nl/laptops/windows/filter', { waitUntil: 'networkidle0' });

  const pageTitle = await page.$eval('.filtered-search__header h1', (element) => element.textContent.trim());

  const products = await page.$$eval('.product-card', (rows) => {
    return rows.map((row) => ({
      productTitle: row.querySelector('.product-card__title').textContent.trim(),
      price: row.querySelector('.sales-price__current').textContent.trim(),
      Reviews: row.querySelector('.review-rating__reviews').textContent.trim(),  
      Scherm: row.querySelectorAll('.dynamic-highlight__key--with-explanation')[0].textContent.trim()
      .replace("\n                    "," "),
      Proccesor: row.querySelectorAll('.dynamic-highlight__key--with-explanation')[1].textContent.trim()
      .replace("\n                    "," "),
      RAM: row.querySelectorAll('.dynamic-highlight__key--with-explanation')[2].textContent.trim()
      .replace("\n                    "," "),
      avaiable: row.querySelector(".color--available") != null ? true : false,
    
    
      
    }));
  });

  const filteredProducts = products.filter((product) => {
    const newInch = product.Scherm.replace(" inch", "").replace(",","");
    const rawInch = parseInt(newInch)
    const newPrice = product.price.replace(",-", "").replace(".","");
    const intPrice = parseInt(newPrice);
    return rawInch == 156 && intPrice > 500;


  });

 console.log(pageTitle);
 // console.log(products);
  console.log(filteredProducts);


 fs.writeFileSync('filteredWindows.json', JSON.stringify(filteredProducts, null, 2),'utf8');

  await browser.close();
}
// Scrape Mac
async function scrapeMac() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36');
    await page.goto('https://www.coolblue.be/nl/laptops/apple-macbook/apple-macbook-pro', { waitUntil: 'networkidle0' });
  
    const pageTitle = await page.$eval('.filtered-search__header h1', (element) => element.textContent.trim());
  
    const products = await page.$$eval('.product-card', (rows) => {
      return rows.map((row) => ({
        productTitle: row.querySelector('.product-card__title').textContent.trim(),
        price: row.querySelector('.sales-price__current').textContent.trim(),    
        Reviews: row.querySelector('.review-rating__reviews').textContent.trim(),
        Proccessor: row.querySelectorAll('.dynamic-highlight__key--with-explanation')[0].textContent.trim()
      .replace("\n                    "," "),
        Scherm: row.querySelectorAll('.dynamic-highlight__key--with-explanation')[1].textContent.trim()
      .replace("\n                    "," "),
        Ram: row.querySelectorAll('.dynamic-highlight__key--with-explanation')[2].textContent.trim()
      .replace("\n                    "," "),
        avaiable: row.querySelector(".color--available") != null ? true : false,
        
      
      
        
      }));
    });
  
    const filteredProducts = products.filter((product) => {
      const newRam = product.Ram.replace("GB RAM", " ");
      const ramNumber = parseInt(newRam);
      const newPrice = product.price.replace(",-", "").replace(".","");
      const intPrice = parseInt(newPrice);
      return ramNumber == 32 && newPrice > 1750;
    });
  
    console.log(pageTitle);
    //console.log(products);
    console.log(filteredProducts);
  
  
  fs.writeFileSync('filteredMacs.json', JSON.stringify(filteredProducts, null, 2),'utf8');

  
    await browser.close();
  }
  

export { scrapewindows, scrapeMac };
