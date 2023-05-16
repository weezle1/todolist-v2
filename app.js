const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public")); // enables us to use external files

//mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {useNewUrlParser: true});
mongoose.connect("mongodb+srv://admin-westley:oIjslL3q0vhktA7Z@cluster0.ova3zfu.mongodb.net/todolistDB", {useNewUrlParser: true});

/*
Create Items SCHEMA
Has only one field: Name
Name of each of our items

const <schemaName> = {
  <filedName> : <FieldDataType>,
  ...
}
*/
const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter a valid item in String format"]
  }
});
//create a MODEL based on itemSchema
const Item = new mongoose.model ("Item", itemSchema);

const item1 = new Item({
  //name: "Pencil"
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  //name: "Pen"
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  //name: "Paper"
  name: "<!-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

// favicon.ico was being added to the lists collection automatically by browser, need to escape it
app.get('/favicon.ico', (req, res) => res.status(204));

app.get("/", function(req, res){
  Item.find()
  .then(foundItems => {
    if(foundItems.length === 0){
      Item.insertMany(defaultItems)
      .then(result => {
        console.log("Successfully added items");
      })
      .catch(err => {
        console.log(err);
      });
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  })
  .catch(err => {
    console.log(err);
  });
});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  // find will give you all documenta
  //List.find({name: customListName})
  // findOne() will give you single document
  List.findOne({name: customListName})
  .then(foundList => {
    if(!foundList){
      console.log("List does not exist");
      // Create a new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });

      list.save();

      res.redirect("/" + customListName);
    }else{
      console.log("List already exists");
      console.log(foundList);
      // Show an existing list

      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  })
  .catch(err => {
    console.log(err);
  });
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName})
    .then(foundList => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
    .catch(err => {
      console.log(err);
    })
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    //Item.deleteOne({_id: checkedItemId})
    Item.findByIdAndRemove(checkedItemId)
    .then(result => {
      console.log("Successfully deleted item");
      res.redirect("/");
    })
    .catch(err => {
      console.log(err);
    });
  }else{
    // Updates a single document based on the filter and sort criteria.
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
    .then(foundList => {
      res.redirect("/" + listName);
    })
    .catch(err => {
      console.log(err);
    });
  }
});

app.listen(3000, () => console.log("Server started on port 3000"));
