const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.USE}:${process.env.PASWD}@cluster0.suexuc8.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.get('/', (req, res) => {
    res.send("Whatt ......... ????")
})

async function run() {
  try {
    const classesCollection = client.db("classesCollection").collection('classes');
    const instructorsCollection = client.db("classesCollection").collection('instructors');
    
    app.get('/class', async(req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    })
    
    app.get('/instructor', async(req, res) => {
      const result = await instructorsCollection.find().toArray();
      res.send(result);
    })

    console.log("Pinged to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log('Server is running on :', port);
})