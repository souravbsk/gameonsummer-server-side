# b7a12-summer-camp-server_side-souravbsk


# Game On Server Server

- technology use : mongodb, express, jwt, stripe, cors, dotenv

- apply some private middleware for admin, instructor , and student

- for create an user data store in mongodb database using users route post method

- for get all user and manage their role in admin panel using /users get method

- app.delete("/users/admin/:id",) __ this route  for only admin can delete any user
-  app.patch("/users/admin/:id") _ this route for an admin can change role make an admin from any user 
-   app.patch("/users/instructor/:id") this route for an admin can change role make an instructor from any user 



________________________

 -  app.get("/users/admin/:email",) this check is it admin or not for admin private route 
 -   app.get("/users/instructor/:email",)  this check is it instructor or not for admin private route 

 - app.get("/users/student/:email",) this check is it student or not for admin private route 


- app.get("/topclasses",) this route give us top  6 approved  classes base on student enroll 

- app.get("/classes") this route give us all approved  classes 

-  app.get("/manageClasses",) this route for admin . admin can get all the classes 
-   app.get("/manageClasses/:id") for send a feedback 

-   app.patch("/manageClasses/:id",) this route only for admin . admin can update classes status 
-   app.put("/manageClasses/:id",) this route add a review property from admin

- app.delete("/manageClasses/:id",) this route use to delete a classes form admin role

- app.post("/classes", ) only instructor can post a new class with this route

-   app.get( "/instructorClasses",) this route give a specifics instructor all classes


-   app.post("/carts",) only student can add class in cart with route 

-  app.get("/carts", ) student can  their all cart items.   

-  app.delete("/carts/:id",) student can delete their classes from cart

-   app.post( "/create-payment-intent",) payment request 
      
-  app.post("/payments",) after successfully payment enroll increase 1 and available seats decries 1. and also this class delete from cart item , and store all details from payment database collection

-  app.get("/enrollClasses",) after payment student watch their enroll classes

 -   app.get("/student/paymentHistory",)  after payment , payment history like, transitionId, data can show in this route , also recent pay classes show in top 

 -   app.get("/topInstructor", ) home top 6 Instructor base on their all classes total enroll student 

 -    app.get("/instructors",) this route give give up all Instructor  with their classes some details 
 - app.get("/instructorClasses/:id") this route give us a specific instructor all approved classes
 

 ### optional task 
 - adminstack, instructorStack ,studentStack give us some information base on classes


- finally added profile page 