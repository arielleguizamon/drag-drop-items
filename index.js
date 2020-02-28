const express = require("express");
const multer = require("multer");
const path = require("path");
var bodyParser = require("body-parser");
const app = express();
const port = 3000;
const mongoose = require("mongoose");
mongoose.connect("mongodb://mongo:27017/challenge", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));

app.listen(port, () => console.log(`App listening on port ${port}!`));

/****************** Model  ******************/

const Item = mongoose.model("Item", {
  description: String,
  file: String,
  position: Number
});

/****************** File Upload  ******************/

const imageFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
    req.fileValidationError = "Only image files are allowed!";
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __dirname + "/public/img");
  },

  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  }
});
const upload = multer({ storage, fileFilter: imageFilter }).single("file");

/****************** Endpoints ******************/

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/front/index.html");
});

app.post("/api/items", (req, res) => {
  upload(req, res, async err => {
    if (err || !req.file || !req.body.description) {
      console.log(err, req.file, req.body.description);
      return res.status(400).json("Error");
    } else {
      const count = await Item.count();
      const item = new Item({
        description: req.body.description,
        position: count,
        file: req.file.filename
      });
      try {
        const saved = await item.save();
        res.status(201).json(saved);
      } catch (err) {
        res.status(400).json(err);
      }
    }
  });
});

app.put("/api/items/:id", async (req, res) => {
  const id = req.params.id;
  upload(req, res, async err => {
    if (err) {
      return res.status(400).json("Error", err);
    } else {
      const item = await Item.findById(id);
      if (req.file) item.file = req.file.filename;
      item.description = req.body.description;
      try {
        const saved = await item.save();
        res.status(200).json(saved);
      } catch (err) {
        res.status(400).json(err);
      }
    }
  });
});

app.get("/api/items", async (req, res) => {
  const items = await Item.find().sort("position");
  res.status(200).json(items);
});

app.post("/api/items/:id/position", async (req, res) => {
  const item = await Item.findByIdAndUpdate(
    req.params.id,
    { position: req.body.position },
    { new: true }
  );
  return res.status(200).json(item);
});

app.post("/api/items/positions", async (req, res) => {
  const { from, to, type } = req.body;
  const operator = type === "add" ? 1 : -1;
  const items = await Item.updateMany(
    { position: { $gte: from, $lte: to } },
    { $inc: { position: operator } }
  );
  return res.status(200).json(items);
});

app.delete("/api/items/:id", async (req, res) => {
  await Item.findByIdAndDelete(req.params.id);
  return res.status(204).json();
});
