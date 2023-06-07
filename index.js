const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
const  jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.USER_PASS}@cluster0.pr3rbd0.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("GameOnSummer").collection("users");
    const classCollection = client.db("GameOnSummer").collection("classes")


    app.get("/jwt",(req,res) => {
        const user = req.query.email;
        const token  =jwt.sign(user,process.env.SECRET_ACCESS_TOKEN,{
            expiresIn:"1h"
        })
        res.send({token})
    })



    //users api create
    app.post("/users", async (req,res) => {
        const newUser = req.body;
        const query = {email: newUser?.email};
        const findUser  = await userCollection.findOne(query);
        if(findUser){
            return res.send({message: "user already exist"})
        }
        newUser.role = "student"
        const result = await userCollection.insertOne(newUser);
        res.send(result)
    })


    //classes api create
    app.get("/classes", async (req,res) => {
        const result = await classCollection.find({}).sort({ enrolled: -1 }).limit(6).toArray();
        res.send(result)
    })















    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello summer Camp running");
});

app.listen(port, (req, res) => {
  console.log(`summer camp server running on this port ${port}`);
});
