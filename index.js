const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 3000;
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


// ----------------------------------------------------------------
// ---------------------Token Verification-------------------------
// ----------------------------------------------------------------

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  console.log('verification from verifyjwt', authorization);
  if(!authorization){
    return res.status(401).send({ error: 'Unauthorized Access' })
  }
  
  const token = authorization.split(' ')[1];
  
  jwt.verify(token, process.env.B7Students, ( error, decoded )=>{
    if(error){
      return res.status(403).send({ error: 'Unauthorized Access' })
    }

    if(decoded){
      req.decoded = decoded;
      next();           
    }
  })
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------


async function run() {
  try {

    const classesCollection = client.db("classesCollection").collection('classes');
    const instructorsCollection = client.db("classesCollection").collection('instructors');
    const specialitiesCollection = client.db("classesCollection").collection('specialities');
    const reviewsCollection = client.db("classesCollection").collection('reviews');
    const cartCollection = client.db("classesCollection").collection('cart');
    const coursesCollection = client.db("classesCollection").collection('courses');
    const usersCollection = client.db("classesCollection").collection('users');
    const paymentCollection = client.db("classesCollection").collection('payment');
    const studentCollection = client.db("classesCollection").collection('student');


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



    // -------------------------------------------------------------
    // -----------------------------jwt-----------------------------
    // -------------------------------------------------------------


    app.post('/jwt', async(req, res) => {
      const body = req.body;
      const token = jwt.sign(body, process.env.B7Students, { expiresIn : '100h' });
      res.send({token})
    })




    // --------------------------------------------------------------
    // -------------------------class--------------------------------
    // --------------------------------------------------------------

    app.get('/class', async (req, res) => {
      const result = await classesCollection.find().sort({ name: 1 }).toArray();
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


    app.get('/myClass/:email', async (req, res) => {
      const email = req.params.email;
      const query = { instructorEmail: email };
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    })


    app.put("/class/availableSeats/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const findTheItem = await classesCollection.findOne(query);

      if (!findTheItem) {
        return res.status(404).json({ error: 'Item not found' });
      }

      findTheItem.availableSeats -= 1;

      const result = await classesCollection.updateOne(query, { $set: findTheItem });
      res.send(result);
    })


    app.put("/class/availableSeatsIncrease/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const findTheItem = await classesCollection.findOne(query);

      if (!findTheItem) {
        return res.status(404).json({ error: 'Item not found' });
      }

      findTheItem.availableSeats += 1;

      const result = await classesCollection.updateOne(query, { $set: findTheItem });

      res.send(result);
    })


    app.put("/class/remove/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const findTheItem = await classesCollection.findOne(query);
      const body = req.body.it;

      if (!findTheItem) {
        return res.status(404).json({ error: 'Item not found' });
      }
   
      body.availableSeats = parseFloat(body.availableSeats);
      body.price = parseFloat(body.price);

      const updateIt = {
        $set: {
          name: body.name,
          image: body.image,
          instructorEmail: body.instructorEmail,
          instructorName: body.instructorName,
          availableSeats: body.availableSeats,
          price: body.price,
          category: body.category,
          status: "pending",
          feedback: null
        }
      }
      
      const result = await classesCollection.updateOne(query, updateIt);
      res.send(result);
    })


    app.post('/class', async (req, res) => {

      const body = req.body;

      if (body && typeof body === 'object') {
        body.availableSeats = parseFloat(body.availableSeats);
        body.price = parseFloat(body.price);
        const result = await classesCollection.insertOne(body);
        res.send(result);
      }

      else {
        res.status(400).send({ error: 'Invalid request structure' });
      }
    })


    app.patch('/class/:iid', async (req, res) => {
      const id = req.params.iid;
      const query = { _id: new ObjectId(id) };
      const updated = { $set: { status: "approved" } };
      const result = await classesCollection.updateOne(query, updated);
      res.send(result);
    });


    app.put('/class/:id', async (req, res) => {
      const id = req.params.id;
      const feed = req.body?.hi?.feedback;
      const query = { _id: new ObjectId(id) };
      const found = await classesCollection.findOne(query);

      const update = { $set: { status: "denied", feedback: feed } };

      const result = await classesCollection.updateOne(query, update);

      if (result.modifiedCount === 1) {
        res.status(200).json({ message: 'Document updated successfully' });
      } else {
        res.status(404).json({ message: 'Document not found or not updated' });
      }
    })




    // --------------------------------------------------------------
    // -------------------------cart---------------------------------
    // --------------------------------------------------------------


    app.get('/cart/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    })


    app.get('/cart', verifyJWT, async (req, res) => {
      const result = await cartCollection.find().toArray();
      res.send(result);
    })


    app.delete('/cart/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { productId: id };

        const result = await cartCollection.deleteOne(query);

        if (result.deletedCount === 1) {
          res.send({ acknowledged: true, deletedCount: 1 });
        }
        else {
          res.status(404).send({ acknowledged: false, message: "Error occurred" });
        }
      }

      catch (error) {
        res.status(500).send({ acknowledged: false, error: error.message });
      }
    })


    app.post('/cart/:userEmail', verifyJWT, async (req, res) => {
      const userEmail = req.params.userEmail;
      const body = req.body;
      const productId = body?.ite?._id;

      const cartItem = await cartCollection.findOne({ userEmail, productId });

      if (cartItem) {
        return res.send({ error: 'Your desired course already exists in the cart' });
      }

      const result = await cartCollection.insertOne({ ...body, userEmail, productId });
      res.send(result);
    })




    // --------------------------------------------------------------
    // -------------------------users--------------------------------
    // --------------------------------------------------------------

    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().sort({ displayName: 1 }).toArray();
      res.send(result);
    })


    app.post('/users', async (req, res) => {
      const body = req?.body?.user?.providerData[0];
      const email = body?.email;
      const query = { email : email };
      const findUser = await usersCollection.findOne(query);
      console.log(findUser);

      if(findUser){
        return;
      }
      
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


    app.post('/intentToPayment', async (req, res) => {
      const { price } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: price * 100,
        currency: "usd",
        payment_method_types: ["card"]
      })
      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })


    app.post('/payments', async (req, res) => {
      const payment = req.body;
      const result = await paymentCollection.insertOne(payment);

      // ---------------------------delete from cart---------------------------
      const query = { _id: new ObjectId(payment?.item?._id) };
      const deleteItem = await cartCollection.deleteOne(query);
      // ----------------------------------------------------------------------

      if (deleteItem.deletedCount > 0) {
        res.send({ result, deleteItem });
      }
      else {
        res.send({ acknowledged: false, message: "Error occurred" });
      }
    })


    app.get('/payments', async (req, res) => {
      const result = await paymentCollection.find().toArray();
      res.send(result);
    })


    app.get('/payments/:userEmail', async (req, res) => {
      const userEmail = req.params.userEmail;
      const query = { email: userEmail };
      const result = await paymentCollection.find(query).sort({ date: -1 }).toArray();
      res.send(result);
    })




    // -------------------------------------------------------------------------------------
    // ---------------------------------------Courses---------------------------------------
    // -------------------------------------------------------------------------------------


    app.post('/courses', async (req, res) => {
      const result = await coursesCollection.insertOne(req.body);
      res.send(result);
    })


    app.get('/courses', async (req, res) => {
      const result = await coursesCollection.find().toArray();
      res.send(result);
    })



    // -------------------------------------------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------------------



    console.log("Pinged to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log('Server is running on :', port);
})