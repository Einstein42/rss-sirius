'use strict'

const Spark = require('node-sparky')
const express = require('express')
const bodyParser = require('body-parser')
const feedparser = require('feedparser-promised')
var request = require('request')
const logger = require('./lib/modules/logger')
const config = require('dotenv').config({path: '.env'})


logger.info('Starting Sirius RSS Feed Bot')

const feeds = {
  security: ['https://tools.cisco.com/security/center/psirtrss20/CiscoSecurityAdvisory.xml'],
  uc: ['https://communities.cisco.com/community/feeds/allcontent?community=2275']
}

const httpOptions = {
  gzip: true,
  method: 'GET',
  headers: {
    'User-Agent': 'spark'
  }
}

async function getFeed(msg, url, number, type) {
  httpOptions.url = url
  feedparser.parse(httpOptions)
    .then((items) => {
      let results = `### Last ${number} ${type.toUpperCase()} RSS News Items  \r`
      for (let i = 0; i < number; i++) {
        if (items[i] !== undefined) results += `  * [${items[i].title}](${items[i].link})  \r`
      }
      return results
    })
    .then((markdown) => {
      spark.messageSend({
        roomId: msg.roomId,
        markdown: markdown
      })
    })
    .catch(err => console.error(err))
}

async function parseMessage(msg) {
  let possibleTopics = ['security', 'uc']
  for (let topic of possibleTopics) {
    if (msg.text.toLowerCase().indexOf(topic) > -1) {
      let number = 10
      let command = msg.text.toLowerCase().split(`${topic} `).pop()
      if (Number.isInteger(parseInt(command))) number = parseInt(command)
      for (let feed of feeds[topic]) {
        getFeed(msg, feed, number, topic)
      }
    }
  }
}

const spark = new Spark({
  token: config.parsed.token,
  webhookSecret: config.parsed.webhooksecret
})

const port = parseInt(process.env.PORT || '3300', 10)

spark.on('messages-created', async msg => {
  if (msg.personEmail === 'siriusrss@sparkbot.io') { return }
  logger.debug(`${msg.personEmail} said: ${msg.text}`)
  parseMessage(msg)
})

const app = express()
app.use(bodyParser.json())

app.post('/webhook', spark.webhookListen())

app.listen(port, function() {
  // get exisiting webhooks
  spark.webhooksGet()
    // remove all existing webhooks
    .then(webhooks => webhooks.map(webhook => spark.webhookRemove(webhook.id)))
    // create spark webhook directed back to the externally accessible
    // express route defined above.
    .then(() => spark.webhookAdd({
      name: 'rss',
      targetUrl: 'https://spark.3csolutions.net/webhook',
      resource: 'all',
      event: 'all'
    }))
  logger.info(`Listening on port ${port}`);
})
