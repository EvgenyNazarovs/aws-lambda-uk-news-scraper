# aws-lambda-uk-news-scraper

A scheduled web scraping lambda that retrieves UK news media headlines, along with tags, authors, and other metadata, on a 2-hourly basis, and saves to DynamoDb. Currently deployed on AWS and gets Guardian articles only.

The project also includes three other Lambdas for basic GET requests to interact with the data.

Made with NodeJS14.x, AWS Lambda, DynamoDb, Apigateway, Puppeteer, deployed using SAM.

## Acknowledgments

Thanks Tamás Sallai for the suggested wrapper functions for safer and faster scraping with Puppeteer.
https://advancedweb.hu/how-to-speed-up-puppeteer-scraping-with-parallelization/

Thanks Tayfun for suggested project organisation in https://github.com/yt/sam-puppeteer-boilerplate








