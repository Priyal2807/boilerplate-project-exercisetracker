const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
const MONGO_URI = process.env.db;

mongoose.connect(MONGO_URI,
    () => {
        console.log("connected successfully");
    })

let userSchema = new mongoose.Schema({
    userName: String,
    log: Array
})
let User = mongoose.model("User", userSchema);
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.post('/api/users', async (req, res) => {
    let newuser = new User({
        userName: req.body.username,
        log:[]
    })
    await newuser.save()
    User.findOne({ userName: req.body.username }, function (err, data) {
        if (err) return console.error(err);
        return res.send({"username": req.body.username, "_id": data._id})
    })
    
})
app.get("/api/users",  (req, res) => {
    let newArray = []
    User.find({}, (err, data) => {
        data.forEach(u => {
            let foundUser = {
                "username": u.userName,
                "_id": u._id
            }
            newArray.push(foundUser)
        })

        res.send(newArray);
    })

})

app.post('/api/users/:_id/exercises', (req, res) => {
    let id = req.params._id;

    if (id) {
        User.findById(id, (err, user) => {
            if (err) console.error(err)
            let desc = req.body.description;
            let dur = parseInt(req.body.duration);
            let date = req.body.date ? new Date(req.body.date).toDateString() : new Date().toDateString();
            //console.log(user.userName);
            let arr = user.log
            arr.push({
                description: desc,
                duration: dur,
                date: date
            })
            user.logs = arr
            user.save()
            return res.send({ "username": user.userName, "description": desc, "duration": dur, "date": date, "_id": user._id })
        })

    }
})

app.get('/api/users/:id/logs', (req, res) => {
    let id = req.params.id;
    let from = req.query.from;
    let to = req.query.to;
    let limit = parseInt(req.query.limit);
    let arr = []
  
    User.findById(id, (err, foundUser) => {
    if (Object.keys(req.query).length === 0) {
        
            let count = foundUser.log.length;
            return res.send({ userName: foundUser.userName, count: count, "_id": id, log: foundUser.log })
        
    }
    if (from)
    {
        arr = foundUser.log.filter((i) => new Date(i.date) >= new Date(from))
    }
    if (to) {
        arr = foundUser.log.filter((i) => new Date(i.date) <= new Date(to))
    }
    if (limit)
    {
        arr = foundUser.log.slice(0, limit);
    }
    return res.send({ userName: foundUser.userName, count: limit, "_id": id, log: arr })

    })

})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
