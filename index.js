require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient } = require('mongodb');
const url_parser = require('url');
const dns = require('dns');

const client = new MongoClient(process.env.MONGO_URI);
const db = client.db('url_shorterner');
const collection = db.collection('url_post');

// Basic Configuration
const port = process.env.PORT;

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// POST handle request
app.post('/api/shorturl', function(req, res) {
  console.log(req.body);
  const url = req.body.url;

  // test invalid url using regex
  const regex_url_pattern = /^(http|https)(:\/\/)/;
  if(!regex_url_pattern.test(url)) {
    return res.json({
      error: "invalid url"
    });
  }

  const dnslookup = dns.lookup(url_parser.parse(url).hostname, async function(err, address) {
    if(err) {
      res.json({ error: 'invalid url' })
    }
    else {
      const url_counter = await collection.countDocuments({});
      const url_document = {
        url: url,
        short_url: url_counter
      }

      const result = await collection.insertOne(url_document);
      console.log(result);
      res.json({
        original_url: url,
        short_url: url_counter
      });
    }
  });
});

app.get('/api/shorturl/:short_url', async function(req, res) {
  const shortUrl = req.params.short_url;
  const urlDoc = await collection.findOne({
    short_url: +shortUrl
  });

  res.redirect(urlDoc.url);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
