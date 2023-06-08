const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require("stripe")(process.env.SECRET_STRIPE_TOKEN);
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      res.status(401).send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

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
    const classCollection = client.db("GameOnSummer").collection("classes");
    const cartCollection = client.db("GameOnSummer").collection("carts");
    const paymentCollection = client.db("GameOnSummer").collection("payments");
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    //verify admin middleware ________________________
    const verifyAdmin = async (req, res, next) => {
      const email = req?.decoded?.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user?.role !== "admin") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden request" });
      }
      next();
    };

    //verify Instructor middleware _____________
    const verifyInstructor = async (req, res, next) => {
      const email = req.decoded?.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user?.role !== "instructor") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden request" });
      }
      next();
    };
    //users api create

    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const query = { email: newUser?.email };
      const findUser = await userCollection.findOne(query);
      if (findUser) {
        return res.send({ message: "user already exist" });
      }
      newUser.role = "student";
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });

    // admin route >>>>>> all user
    app.get("/users", verifyJWT, verifyAdmin, async (req, res) => {
      const result = await userCollection.find({}).toArray();
      res.send(result);
    });

    // admin route >>>> delete user
    app.delete("/users/admin/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    // user make admin___________
    app.patch("/users/admin/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateUserRole = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(filter, updateUserRole);
      res.send(result);
    });

    // user make instructor
    app.patch("/users/instructor/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateUserRole = {
        $set: {
          role: "instructor",
        },
      };
      const result = await userCollection.updateOne(filter, updateUserRole);
      res.send(result);
    });

    // user role admin or not check api _________________________
    app.get("/users/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
        return res.send({ admin: false });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });

    // instructor route >>>.user role instructor or not check api
    app.get("/users/instructor/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      if (req.decoded?.email !== email) {
        return res.send({ instructor: false });
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      const result = { instructor: user?.role === "instructor" };
      res.send(result);
    });



    // student route >>>.user role instructor or not check api
    app.get("/users/student/:email", verifyJWT, async (req, res) => {
      const email = req.params?.email;
 
      if (req.decoded?.email != email) {
        return res.send({ student: false });
      }
      const query = { email: email };
      console.log(query);
      const user = await userCollection.findOne(query);
      const result = { student: user?.role === "student" };
      res.send(result);
    });


    //classes api create_______________________________ for user
    app.get("/topclasses", async (req, res) => {
      const result = await classCollection
        .find({})
        .sort({ enrolled: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });
    app.get("/classes", async (req, res) => {
      const result = await classCollection
        .find({ status: "approved" })
        .sort({ enrolled: -1 })
        .toArray();
      res.send(result);
    });
    app.get("/manageClasses", verifyJWT, verifyAdmin, async (req, res) => {
      const result = await classCollection.find({}).toArray();
      res.send(result);
    });

    // class status change for admin
    app.patch(
      "/manageClasses/:id",
      verifyJWT,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const classItemStatus = req.body;

        const updateStatus = {
          $set: {
            status: classItemStatus.status,
          },
        };

        const result = await classCollection.updateOne(filter, updateStatus);
        res.send(result);
      }
    );

    //classDelete admin______________

    app.delete("/manageClasses/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await classCollection.deleteOne(filter);
      res.send(result);
    });

    // classes post for instructor  ________________________

    app.post("/classes", verifyJWT, verifyInstructor, async (req, res) => {
      const newClass = req.body;
      const result = await classCollection.insertOne(newClass);
      res.send(result);
    });

    // classList for instructor_________________
    app.get(
      "/instructorClasses",
      verifyJWT,
      verifyInstructor,
      async (req, res) => {
        const email = req.query.email;

        const query = { instructorEmail: email };
        const result = await classCollection.find(query).toArray();
        res.send(result);
      }
    );

    //cart api______________________________________
    app.post("/carts", async (req, res) => {
      const newItem = req.body;
      const result = await cartCollection.insertOne(newItem);
      res.send(result);
    });

    // student class cart
    app.get("/carts", verifyJWT, async (req, res) => {
      const email = req.query?.email;

      if (req?.decoded?.email !== email) {
        return res
          .status(401)
          .send({ error: true, message: "unauthorized user" });
      }
      const query = { userEmail: email };

      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    //online Stipe Payment Api
    app.post("/create-payment-intent", verifyJWT, async (req, res) => {
      const { price } = req.body;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "inr",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    //student payment api
    app.post("/payments", verifyJWT, async (req, res) => {
      const newPayment = req.body;
      const insertResult = await paymentCollection.insertOne(newPayment);
      const cartId = newPayment.cartItem.map((id) => new ObjectId(id));
      const query = { _id: { $in: cartId } };
      const deleteResult = await cartCollection.deleteMany(query);
      res.send({ result: insertResult, deleteResult });
      // res.send(cartId);
    });

    // student enroll classes
    app.get("/enrollClasses", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const enrollClass = [];
      const classResult = await classCollection.find({}).toArray();
      const query = { email: email };
      const paymentResult = await paymentCollection.find(query).toArray();
      const paymentItem = paymentResult.map((paymentItem) => {
        const classItemId = paymentItem?.classItemId;
        classItemId.map((classId) => {
          const orderClass = classResult.find(
            (classItem) => classItem._id == classId
          );
          enrollClass.push(orderClass);
        });
      });
      // const filter =
      res.send(enrollClass);
    });

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
