import puppeteer from 'puppeteer';
import fs from 'fs';
import readline from 'readline';

async function saveDataToFile(data, shouldOverwrite) {
  try {
    await fs.promises.access('pokemonData.json');

    if (!shouldOverwrite) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question('File already exists. Do you want to overwrite? (yes/no): ', async (answer) => {
        if (answer.toLowerCase() === 'yes') {
          await fs.promises.writeFile('pokemonData.json', JSON.stringify(data, null, 2), 'utf-8');
          console.log('Data saved to pokemonData.json');
        } else {
          console.log('Data not overwritten.');
        }
        rl.close();
      });
    } else {
      await fs.promises.writeFile('pokemonData.json', JSON.stringify(data, null, 2), 'utf-8');
      console.log('Data saved to pokemonData.json');
    }
  } catch (error) {
    await fs.promises.writeFile('pokemonData.json', JSON.stringify(data, null, 2), 'utf-8');
    console.log('Data saved to pokemonData.json');
  }
}

async function scrapePokemon() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36');

  await page.goto('https://www.pricecharting.com/console/pokemon-base-set', { waitUntil: 'networkidle0' });

  const pageTitle = await page.$eval('#console-header h1', (element) => element.textContent.trim());

  const trElements = await page.$$('#games_table tbody tr');
  const rowData = [];

  for (const trElement of trElements) {
    const originalPageData = {};
    const productID = await trElement.evaluate((el) => el.getAttribute('data-product'));
    const titleElement = await trElement.$('.title a');
    const title = await titleElement.evaluate((el) => el.textContent.trim());
    const titleLink = await titleElement.evaluate((el) => el.getAttribute('href'));
    const usedPrice = await trElement.$eval('.price.numeric.used_price .js-price', (element) => element.textContent.trim());
    const cibPrice = await trElement.$eval('.price.numeric.cib_price .js-price', (element) => element.textContent.trim());
    const newPrice = await trElement.$eval('.price.numeric.new_price .js-price', (element) => element.textContent.trim());

    let linkedPageData = [];

    if (titleLink) {
      const completeURL = `https://www.pricecharting.com${titleLink}`;
      linkedPageData = await scrapeLinkedPage(browser, completeURL);
      // Filter the linkedPageData based on the date
      linkedPageData = linkedPageData.filter((linkedItem) => linkedItem.date.includes('2023'));
    }

    
if (usedPrice) {
  // Filter the linkedPageData to remove empty entries
  linkedPageData = linkedPageData.filter((item) => item.date || item.title || item.price);

  // Check if cibPrice or newPrice is empty
  if (cibPrice || newPrice || linkedPageData.length > 0) {
    rowData.push({
      productID,
      title,
      usedPrice: usedPrice || "NVT",
      cibPrice: cibPrice|| "NVT" ,
       newPrice : newPrice || "NVT",
      linkedPageData, // Add the filtered linked page data
    });
  }
}
  }

 
  const filteredData = rowData.filter((item) => {
    return (
      parseFloat(item.usedPrice.replace('$', '').replace(',', '')) > 2500 ||
      parseFloat(item.newPrice.replace('$', '').replace(',', '')) > 7500
    );
  });

  // Combine all the data
  const dataToSave = {
    pageTitle,
    filteredData,
  };

  // Save the data to the file and ask if the user wants to overwrite
  saveDataToFile(dataToSave, false);

  console.log('Data for all rows:');
  rowData.forEach((row, index) => {
    console.log(`Row ${index + 1}:`);
    console.dir(row);
  });

  await browser.close();
}

async function scrapeLinkedPage(browser, url) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const tableRows = await page.$$('table.hoverable-rows tr[id^="ebay-"]');
  const linkedPageData = [];

  for (const row of tableRows) {
    const date = await row.$eval('.date', (element) => element.textContent.trim());
    const title = await row.$eval('.title a', (element) => element.textContent.trim());
    const price = await row.$eval('.numeric .js-price', (element) => element.textContent.trim());

    linkedPageData.push({ date, title, price });
  }

  await page.close();
  return linkedPageData;
}

export { scrapePokemon };
