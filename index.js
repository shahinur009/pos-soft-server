const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000

app.use(cors());
app.use(express.json());


//const uri = "mongodb://localhost:27017"
//console.log(uri);

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
    const userCollections = client.db('pos-soft').collection('users');
    const productCollections = client.db('pos-soft').collection('products');
    const customerCollections = client.db('pos-soft').collection('customers');
    const salesCollections = client.db('pos-soft').collection('sales');
    const productsBuyCollections = client.db('pos-soft').collection('productsBuy');

    // get users from db
    app.get('/users', async (req, res) => {
      const result = await userCollections.find().toArray();
      res.send(result);
    })
    // Add products route here:
    app.post('/add-product', async (req, res) => {
      try {
        const productData = {
          ...req.body,
          creationDate: new Date(), // Add current date as creation date
        };
        // Insert the product data into the "products" collection
        const result = await productCollections.insertOne(productData);

        res.status(201).json({ message: 'Product added successfully', productId: result.insertedId });
      } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ message: 'Failed to add product', error });
      }
    });

    // Fetch products for table data show.
    app.get("/products", async (req, res) => {
      try {
        // Fetch products and sort them by creationDate in descending order
        const products = await productCollections.find({}).sort({ creationDate: -1 }).toArray();
        res.status(200).json(products);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch products" });
      }
    });

    // product table data delete api's here.
    app.delete("/products/:id", async (req, res) => {
      const productId = req.params.id;
      // console.log(productId)

      try {
        const result = await productCollections.deleteOne({ _id: new ObjectId(productId) });

        if (result.deletedCount === 1) {
          res.json({ message: "Product deleted successfully" });
        } else {
          res.status(404).json({ message: "Product not found" });
        }
      } catch (error) {
        res.status(500).json({ message: "Error deleting product", error });
      }
    });
    // get products from update route by ID api's here:
    app.get("/products/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const product = await productCollections.findOne({ _id: new ObjectId(id) });
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }
        res.json(product);
      } catch (error) {
        res.status(500).json({ message: "Error fetching product", error });
      }
    });
    // update products by ID api's here:
    app.put("/products/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const updatedData = req.body;

        // Remove undefined fields (like optional image URL)
        Object.keys(updatedData).forEach((key) => {
          if (updatedData[key] === undefined) delete updatedData[key];
        });

        const result = await productCollections.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );

        if (result.modifiedCount === 0) {
          return res.status(404).json({ message: "Product not found or no changes made" });
        }

        res.json({ message: "Product updated successfully" });
      } catch (error) {
        res.status(500).json({ message: "Error updating product", error });
      }
    });
    // All products show api here.(report)
    app.get("/products-report", async (req, res) => {
      const { category } = req.query; // Get the category from query params

      try {
        let query = {}; // Default empty query

        // If category is provided, filter by category
        if (category) {
          query.productCategory = category;
        }

        const products = await productCollections.find(query).toArray(); // Fetch products based on query
        res.json(products);
      } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).send("Server Error");
      }
    });

    // Add Customer route here:
    app.post('/add-customer', async (req, res) => {
      try {
        const { customerName, mobile } = req.body;
        const existingCustomer = await customerCollections.findOne({ customerName, mobile });

        if (existingCustomer) {
          const updateResult = await customerCollections.updateOne(
            { customerName, mobile },
            { $set: { ...req.body, updateDate: new Date() } }
          );
          res.status(200).json({ message: 'Customer data updated successfully', updatedCustomer: updateResult });
        } else {
          const customerData = {
            ...req.body,
            creationDate: new Date(),
          };
          const result = await customerCollections.insertOne(customerData);
          res.status(201).json({ message: 'Customer added successfully', productId: result.insertedId });
        }
      } catch (error) {
        console.error('Error adding/updating customer:', error);
        res.status(500).json({ message: 'Failed to add or update customer', error });
      }
    });

    // Fetch customers for table data show.
    app.get("/customers", async (req, res) => {
      try {
        // Fetch customers and sort them by creationDate in descending order
        const customers = await customerCollections.find({}).sort({ creationDate: -1 }).toArray();
        res.status(200).json(customers);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch customers" });
      }
    });
    // Fetch product info for table data show.
    app.get("/product-info", async (req, res) => {
      try {
        // Fetch customers and sort them by creationDate in descending order
        const products = await productCollections.find({}).sort({ creationDate: -1 }).toArray();
        res.status(200).json(products);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch products info" });
      }
    });

    //  stock qty change api here
    app.put("/product-info/:id", async (req, res) => {
      const { id } = req.params;
      const { newStock } = req.body;

      try {
        const result = await productCollections.updateOne(
          { _id: new ObjectId(id) },
          { $set: { productQty: newStock } }
        );

        if (result.modifiedCount > 0) {
          res.status(200).json({ message: "Product stock updated successfully" });
        } else {
          res.status(404).json({ message: "Product not found or no changes made" });
        }
      } catch (error) {
        console.error("Error updating product stock:", error);
        res.status(500).json({ error: "Failed to update product stock" });
      }
    });


    // product table data delete api's here.
    app.delete("/customers/:id", async (req, res) => {
      const customer = req.params.id;
      // console.log(productId)

      try {
        const result = await customerCollections.deleteOne({ _id: new ObjectId(customer) });

        if (result.deletedCount === 1) {
          res.json({ message: "customer deleted successfully" });
        } else {
          res.status(404).json({ message: "customer not found" });
        }
      } catch (error) {
        res.status(500).json({ message: "Error deleting customer", error });
      }
    });

  //  sales data api here
    app.post('/sales', async (req, res) => {
      try {
        const { customerName, mobile, products, due } = req.body;

        const existingCustomer = await salesCollections.findOne({ customerName, mobile });

        if (existingCustomer) {
          const updatedProducts = [...existingCustomer.products, ...products]; 

          const updatedDue = existingCustomer.due + due;

          const updateResult = await salesCollections.updateOne(
            { customerName, mobile }, 
            {
              $set: {
                products: updatedProducts,
                due: updatedDue, 
                updatedDate: new Date(), 
              },
            }
          );

          res.status(200).json({ message: 'Customer sales info updated successfully', productId: existingCustomer._id });
        } else {
          const salesData = {
            ...req.body,
            creationDate: new Date(), 
          };

          const result = await salesCollections.insertOne(salesData);

          res.status(201).json({ message: 'Sales info added successfully', productId: result.insertedId });
        }
      } catch (error) {
        console.error('Error adding/updating sales info:', error);
        res.status(500).json({ message: 'Failed to add/update sales info', error });
      }
    });



    // Fetch customers info for table data show.
    app.get("/customers-info", async (req, res) => {
      try {
        const products = await salesCollections.find({}).sort({ creationDate: -1 }).toArray();
        res.status(200).json(products);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch products info" });
      }
    });

    // Fetch all sales info for table data show.
    app.get("/all-sales-data/:id", async (req, res) => {
      try {
        const query = req.params
        const products = await salesCollections.findOne({ _id: new ObjectId(query) });
        res.status(200).json(products);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch products info" });
      }
    });

    // create products
    app.post('/company-products', async (req, res) => {
      try {
        const productsBuy = req.body;
        console.log(productsBuy);

        const result = await productsBuyCollections.insertOne(productsBuy);

        res.status(201).json({
          message: 'Data inserted successfully', result
        });
      } catch (error) {
        console.error('Error inserting data:', error);
        res.status(500).json({ error: 'Failed to insert data' });
      }
    });

    // purchase report show 
    app.get('/purchase-report', async (req, res) => {
      try {
        // Fetch all purchase data
        const purchases = await productsBuyCollections.find({}).toArray();

        // Process the data and calculate 'বাকি'
        const purchaseReport = purchases.map((purchase, index) => ({
          id: purchase._id,
          index: index + 1,
          companyName: purchase.companyDetails.companyName,
          payableMoney: purchase.companyDetails.payableMoney,
          moneyGiven: purchase.companyDetails.moneyGiven,
          remaining: purchase.companyDetails.payableMoney - purchase.companyDetails.moneyGiven,
        }));

        // Send the processed data back as JSON
        res.json(purchaseReport);
      } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
      }
    });

    // single data 
    app.get('/single-product-report/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const data = await productsBuyCollections.findOne({ _id: new ObjectId(id) })
        res.status(200).send(data)
      } catch (error) {
        res.json({ messages: "have data send problems" });
      }
    })

    app.put("/customers/:id", async (req, res) => {
      const { id } = req.params;
      const due = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };

      const updatedUser = {
        $set: {
          totalDue: due.remainAmount
        }
      }
      console.log(due)

      const result = await customerCollections.updateOne(filter, updatedUser, options);

    });



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
