const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const cron = require('node-cron');
const express = require('express');


async function westernunion_scrape(country,from,to){
  try {
    var json;
      const browser = await puppeteer.launch({
          headless: "shell",
          args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.goto(`https://www.westernunion.com/${country}/en/currency-converter/${from}-to-${to}-rate.html`);
      await new Promise(r => setTimeout(r, 6000));
      const context = await page.content();
      const $ = cheerio.load(context);
      const selector = ".fx-to";
      $(selector).each(function () {
        var mmk_price = $(this).text().replaceAll('MMK', '').trim();
        var unit = "1 "+from.toUpperCase();
        json = {'currency':from.toUpperCase(),'unit':unit,"mmk_price":mmk_price};
        
      });
    await browser.close();
    return json;
  }catch(err){
    console.error(err);
  }
}

async function main() {
  var mArray = [];
  var us = await westernunion_scrape('us', 'usd', 'mmk');
  var fr = await westernunion_scrape('fr', 'eur', 'mmk');
  var sg = await westernunion_scrape('sg', 'sgd', 'mmk');
  var jp = await westernunion_scrape('jp', 'jpy', 'mmk');
  var gb = await westernunion_scrape('gb', 'gbp', 'mmk');
  var au = await westernunion_scrape('au', 'aud', 'mmk');
  var ca = await westernunion_scrape('ca', 'cad', 'mmk');
  mArray.push(us);
  mArray.push(fr);
  mArray.push(sg);
  mArray.push(jp);
  mArray.push(gb);
  mArray.push(au);
  mArray.push(ca);
  return mArray;
}
async function writeData() {
    var data = await main();
    var json = JSON.stringify(data, null, 2);
    fs.writeFile('currency.json', json, (err) => {
        if (err) {
            console.log(err)
        }
    })
}
cron.schedule('* * * * *', async function () {
  await writeData();
});
const app = express();
app.get('/api/currency', async (req, res) => {
  try {
    const filepath = './currency.json'
    fs.readFile(filepath, 'utf8', (err, data) => {
      if (err) {
        console.log(err)

      }
      try {
        const jsonData = JSON.parse(data);
                
        res.status(200)
          .setHeader('Content-Type', 'application/json')
          .json({
            'result': jsonData
          });
      } catch (err) {
        console.error(err);
      };
    });

  } catch (error) {
    res.status(500).json({
      error: error.toString()
    })
  };
});
app.listen(8000, () => {
    console.log('running on port 8000')
})
