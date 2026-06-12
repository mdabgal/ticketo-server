const express = require('express')
// const dotenv = require("dotenv");
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 8080;


app.use(cors());
app.use(express.json());






const uri = process.env.MONGODB_URI;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    const db = client.db("ticketoDb");
    const organizationCollection = db.collection("organizations");
    const eventsCollection = db.collection("events");
    const usersCollection = db.collection("user");

    const bookingCollection = db.collection("bookings");
    const paymentCollection = db.collection("payments");

app.post("/api/organizations", async (req, res) => {
    try {
        const { organizationName, logo, website, description, organizerEmail } = req.body;
        const addData = {
            organizationName,
            logo, 
            website,
            description,
            organizerEmail,
            createdAt: new Date(),
            status: 'active',
        };
        
        const result = await organizationCollection.insertOne(addData);
        
        // 👈 শুধু return result এর বদলে res.status(201).json() ব্যবহার করা হয়েছে
        return res.status(201).json(result); 
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

 app.patch('/api/organizations/:id', async (req, res) => {
      // console.log(req.body);
      const { id } = req.params;
      const { organizationName, logo, website, description, organizerEmail } = req.body;
      console.log(organizationName, logo, website, description, organizerEmail, id);

      const updateData = {
        organizationName,
        logo,
        website,
        description,
        organizerEmail,
      };

      const result = await organizationCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...updateData,
          },
        }
      );
      // console.log(result);

      res.send(result);
    });

app.get('/api/events', async (req, res) => {

 const search = req.query.search;
  const category = req.query.category;
const location = req.query.location;

const query = {};
if (search) {
  query.title = {
    $regex: search,
    $options: "i"
  };
}

if (category) {
  // query.category = category;
  query.category = {$in:category.split(",")}
}
if (location) {
  // query.location = level;

    query.location = {$in:location.split(",")}
}


  
const cursor = eventsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get('/api/single-events/:id', async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await eventsCollection.findOne(query);
      res.send(result);
    });




    app.get('/api/events/:email', async (req, res) => {
      const { email } = req.params;
      console.log(email);

      const result = await eventsCollection.find({ organizationEmail: email }).toArray();
      res.send(result);
    });


  app.post('/api/events', async (req, res) => {
      const data = req.body;
      console.log(data);
      const organizer = await usersCollection.findOne({email: data?.organizationEmail});
      const organizerEventsCount = await eventsCollection.countDocuments({organizationEmail: data?.organizationEmail});
      console.log(organizerEventsCount)
      if(!organizer?.isPremium && organizerEventsCount>=3){
       return res.status(401).send({
          message: "Your free limit is over"
        })
      }



      const result = await eventsCollection.insertOne({
        ...data,

status: 'pending',

      });
     
      

      res.send(result);
    });


      app.patch('/api/events/:id', async (req, res) => {
      // console.log(req.body);
      const { id } = req.params;

      const updateData = req.body;

      const result = await eventsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...updateData,
          },
        }
      );
      // console.log(result);

      res.send(result);
    });

    app.delete('/api/events/:id', async (req, res) => {
      const { id } = req.params;
      const result = await eventsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });






    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})