const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const _ = require('lodash');
const mongoose = require('mongoose');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));


mongoose.connect("mongodb://localhost:27017/todoDB", { useNewUrlParser: true});


const itemsSchema = new mongoose.Schema ({
    name: String,
})

const Item = mongoose.model("Item", itemsSchema);

const defaultItems1 = new Item({
    name: "Welcome! Click Here + to add a task...",
})

const defaultItems2 = new Item({
    name: "Select the checkbox to remove a task.",
})

const defaultItems = [defaultItems1, defaultItems2];

const customListSchema = mongoose.Schema({
    customName: String,
    customList: [itemsSchema],
});

const CustomList = mongoose.model("customList", customListSchema);

app.get("/",function(req,res){

    Item.find(function(err,result){
        if(err){
            console.log(err);
        }else{
            if(result.length === 0){
                // res.send("We are not good");
                // console.log("We are not good");
                res.render("display", {displayName : "Today", itemListDisplay : defaultItems});
            }
            else{

                // console.log(result);
                // res.send("We are good");
                res.render("display", {displayName : "Today", itemListDisplay : result});
            }
        }
    });
})

app.get("/:customListName",function(req, res) {
    const customListName = _.capitalize(req.params.customListName);
    CustomList.findOne({customName: customListName}, function(err,foundList){
        if(!err){
            if(foundList === null){
                const customList = new CustomList({
                    customName: customListName,
                    customList: defaultItems,
                });
                customList.save();
                res.redirect("/" + customListName);
            } else {
                res.render("display", {displayName: customListName, itemsListDisplay: foundList.customList});
            }
        }
    })
})

app.post("/",function(req, res) {
    let newItem = new Item({
        name: req.body.itemAdded,
    })
    if(req.body.list === "Today"){
        newItem.save()
        res.redirect("/");
    } else {
        CustomList.findOne({customName:req.body.list}, function(err,foundList){
            if(!err){
                foundList.customList.push(newItem);
                foundList.save();
                res.redirect("/" + req.body.list);
            }
        })
    }
})

app.post("/delete",function(req,res){
    //Delete the items from Database which get checked
    if(req.body.list == "Today"){
        Item.findByIdAndDelete(req.body.check, function(err){
            if(err){
                console.log(error);
            }else{
                console.log("Succesfully deleted from DB");
                res.redirect("/");
            }
        })
    }else{
        CustomList.findOneAndUpdate({customName: req.body.list}, {$pull:{customList: {_id: req.body.check}}}, function(err,foundList){
            if(!err){
                res.redirect("/" + req.body.list);
            }
        } )
    }

})

app.listen(3000,function(){
    console.log("Server up and running on 3000");
})
