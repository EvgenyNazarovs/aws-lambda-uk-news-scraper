# aws-lambda-uk-news-scraper

Code for the scheduled web scraping lambda that can retrieve UK news media headlines, along with tags, authors, and other metadata, on a 2-hourly basis, and save them to DynamoDb. Proof-of-concept lambda tested with the Guardian web pages.

The SAM set-up also includes three other Lambdas for basic GET requests to interact with the data.

Made with NodeJS14.x, AWS Lambda, DynamoDb, Apigateway, Puppeteer, deployed using SAM.

## Acknowledgments

Thanks Tamás Sallai for the suggested wrapper functions for safer and faster scraping with Puppeteer.
https://advancedweb.hu/how-to-speed-up-puppeteer-scraping-with-parallelization/

Thanks Tayfun for suggested project organisation in https://github.com/yt/sam-puppeteer-boilerplate








