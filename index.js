const express = require("express")
const { MongoClient, ObjectId } = require("mongodb")

const app = express()
app.use(express.json())

// MongoDB setup
const client = new MongoClient(
  process.env.MONGODB_URI ||
    "mongodb+srv://admin:O9FHtogsIbzKroD6@cluster0.wz6rv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
)

// Helper function to coerce isComplete to boolean
function coerceItemData(data) {
  if (data && "isComplete" in data) {
    data.isComplete = !!Number(data.isComplete)
  }
  return data
}

async function start() {
  await client.connect()
  const db = client.db("fleet-app")
  const historic = db.collection("Historic")
  const coords = db.collection("Coords")

  app.post("/update", async (req, res) => {
    const operations = req.body

    try {
      for (const op of operations) {
        console.log(JSON.stringify(op, null, 2))

        if (op.type === "Historic") {
          switch (op.op) {
            case "PUT":
              await historic.insertOne({
                ...coerceItemData(op.data),
                _id: new ObjectId(op.id),
              })
              break

            case "PATCH":
              await historic.updateOne(
                { _id: new ObjectId(op.id) },
                { $set: coerceItemData(op.data) }
              )
              break

            case "DELETE":
              await historic.deleteOne({
                _id: new ObjectId(op.id),
              })
              break
          }
        }

        if (op.type === "Coords") {
          switch (op.op) {
            case "PUT":
              await coords.insertOne({
                ...coerceItemData(op.data),
                _id: new ObjectId(op.id),
              })
              break

            case "PATCH":
              await coords.updateOne(
                { _id: new ObjectId(op.id) },
                { $set: coerceItemData(op.data) }
              )
              break

            case "DELETE":
              await coords.deleteOne({
                _id: new ObjectId(op.id),
              })
              break
          }
        }
      }
      res.json({ success: true })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  app.listen(3000, () => {
    console.log("Server running on port 3000")
  })
}

start().catch(console.error)
