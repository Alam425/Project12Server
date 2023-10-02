const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();
const stripe = require('stripe')('sk_test_51NXvYsKGf3MJO6wVvM5gqDtLJdRtJTLgBuVI6PtIJ6IjD8fgsvI88uwCmXWdLEnBavBmiKVFsmQm0k4nQRv8TYkz00RspGzlZP');

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
    const specialitiesCollection = client.db("classesCollection").collection('specialities');
    const reviewsCollection = client.db("classesCollection").collection('reviews');
    const cartCollection = client.db("classesCollection").collection('cart');
    const usersCollection = client.db("classesCollection").collection('users');
    const paymentCollection = client.db("classesCollection").collection('payment');


    app.get('/specialities', async (req, res) => {
      const result = await specialitiesCollection.find().toArray();
      res.send(result);
    })


    app.get('/reviews', async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    })


    app.get('/instructor', async (req, res) => {
      const result = await instructorsCollection.find().toArray();
      res.send(result);
    })




    // --------------------------------------------------------------
    // -------------------------class--------------------------------
    // --------------------------------------------------------------

    app.get('/class', async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    })


    app.get('/class/:_id', async (req, res) => {
      const id = req.params._id;
      const query = { _id: new ObjectId(id) };
      const selectedCourse = await classesCollection.findOne(query);
      res.send(selectedCourse);
    })


    app.get('/tutor/:_id', async (req, res) => {
      const id = req.params._id;
      const query = { _id: new ObjectId(id) };
      const selectedCourse = await instructorsCollection.findOne(query);
      res.send(selectedCourse);
    })




    // --------------------------------------------------------------
    // -------------------------cart---------------------------------
    // --------------------------------------------------------------

    app.get('/cart', async (req, res) => {
      const result = await cartCollection.find().toArray();
      res.send(result);
    })


    app.delete('/cart/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: id };
        const result = await cartCollection.deleteOne(query);

        if (result.deletedCount === 1) {
          res.send({ acknowledged: true, deletedCount: 1 });
        }

        else {
          res.status(404).send({ acknowledged: false, message: "Error occurred" });
        }
      }

      catch (error) {
        console.error(error);
        res.status(500).send({ acknowledged: false, error: "An error occurred" });
      }
    })


    app.post('/cart', async (req, res) => {
      const body = req.body.item;
      const productId = body._id;
      const cartItem = await cartCollection.findOne({ productId });

      if (cartItem) {
        return res.send({ error: 'Item already exists in the cart' });
      }

      const result = await cartCollection.insertOne({ ...body, productId });
      res.send(result);
    })




    // --------------------------------------------------------------
    // -------------------------users--------------------------------
    // --------------------------------------------------------------

    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    })


    app.post('/users', async (req, res) => {
      const body = req?.body?.user?.providerData[0];
      const numbId = 1000000;
      body.numbId = numbId + 1;
      const result = await usersCollection.insertOne(body);
      res.send(result);
    })


    app.patch('/users/:userId', async (req, res) => {
      const userId = req.params.userId;
      const query = { _id: new ObjectId(userId) };
      const updated = { $set: { phoneNumber: "admin" } };
      const result = await usersCollection.updateOne(query, updated);
      res.send(result);
    });


    app.patch('/users/instructor/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updated = { $set: { phoneNumber: "instructor" } };
      const result = await usersCollection.updateOne(query, updated);
      res.send(result);
    });


    app.patch('/users/student/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updated = { $set: { phoneNumber: null } };
      const result = await usersCollection.updateOne(query, updated);
      res.send(result);
    });


    app.delete('/users/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const user = await usersCollection.deleteOne(query);
        console.log(id);

        if (user.deletedCount === 1) {
          res.send({ acknowledged: true, deletedCount: 1 });
        }
        
        else {
          res.status(404).send({ acknowledged: false, message: "User not found" });
        }
      }

      catch (error) {
        console.error(error);
        res.status(500).send({ acknowledged: false, error: "An error occurred" });
      }
    })




    // ----------------------------------------------------------------------------------
    // -----------------------------------payment----------------------------------------
    // ----------------------------------------------------------------------------------

    app.post('/intentToPayment', async(req, res)=>{
      const { price } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: price*100,
        currency: "usd",
        payment_method_types: ["card"]        
      })
      res.send({
        clientSecret : paymentIntent.client_secret
      })
    })

    app.post('/payments', async(req, res)=>{
      const payment = req.body;
      const result = await paymentCollection.insertOne(payment);

      const query = { _id: { $in: payment.items.map(item => item) }};
      const deleteItem = await cartCollection.deleteMany(query);

      res.send({result, deleteItem});
    })
    app.get('/payments', async(req, res)=>{
      const result = await paymentCollection.find().toArray();
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