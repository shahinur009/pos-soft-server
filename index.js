const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6ypdnj9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const userCollections =client.db('pos-soft').collection('users');
    const productCollections =client.db('pos-soft').collection('products');

    // get users from db
    app.get('/users', async (req, res) => {
        const result = await userCollections.find().toArray();
        res.send(result);
    })
    // insert new user by post method BD collection
    app.post('/users', async (req, res) => {
        const user = req.body;
        console.log(user)
        const result = await userCollections.insertOne(user)
        res.send(result)
    })

    // Connect the client to the server	(optional starting in v4.7)

    // Send a ping to confirm a successful connection
    
  } finally {
    
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('server is running on pos-soft')
})

app.listen(port, () => {
    console.log(`pos-soft server is running on ${port}`)
})
