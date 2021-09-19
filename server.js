const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server);
const expressLayouts = require('express-ejs-layouts')
//Middleware
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

// Set Templating Engine
app.use(expressLayouts)
app.set('layout', './layouts/full-width')

// Peer
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

//Session Modules
const cookieParser = require("cookie-parser");
const sessions = require("express-session");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
var session;

//Database
const mysql = require('mysql2');
const { urlencoded } = require("express");
//Connection Config
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Password', //Varies by db password
    database: 'simlearn',
});

//Session Middleware
const oneHour = 1000 * 60 * 60; //1 hour in milliseconds
app.use(sessions({
    secret: "secretkeysimagile",
    saveUninitialized: true,
    cookie: { maxAge: oneHour },
    resave: false
}));

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/static", express.static('./static'));
app.use("/peerjs", peerServer);

app.get("/", (req, res) => {
    session = req.session;
    if (session.userid) {
        res.render("about", { title: 'About Page', layout: './layouts/sidebar' });
    } else {
        res.render("login");
    }
});

// Route to Login Page
app.get('/login', (req, res) => {
    session = req.session;
    if (session.userid) {
        res.render("about", { title: 'About Page', layout: './layouts/sidebar' });
    } else {
        res.render("login");
    }
});

app.post('/loginverify', (req, res) => {
    // Insert Login Code Here
    let username = req.body.username;
    let password = req.body.password;
    //DB Code
    let sqlquery = "SELECT * FROM user WHERE username = ?";
    let selectedRecord = [username];

    db.connect(function (err){
        db.query(sqlquery, selectedRecord, (err, result) => {
            if (err) {
                return console.error(err.message);
            }
            else {
                try {
                    let qresult = result[0]
                    if (qresult.Password == password) {
                        session = req.session;
                        session.userid = username;
                        console.log(req.session);
                        res.render("about", { title: 'About Page', layout: './layouts/sidebar' });
                    }
                    else {
                        console.log("Wrong Password");
                        res.render("login");
                    }
                } catch (exception) {
                    console.log("Invalid username or password");
                }
            }
        })
    })
});

//Route to dashboard
app.get('/dashboard', (req, res) => {
    session = req.session;
    if (session.userid) {
        res.render("about", { title: 'About Page', layout: './layouts/sidebar' });
    } else {
        res.render("login");
        console.log("Please log in");
    }
});

//Room Page
app.get("/:room", (req, res) => {
    session = req.session;
    if (session.userid) {
        res.render("room", { roomId: req.params.room, userId: session.userid });
    } else {
        res.render("login");
    }
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);

    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message);
    });
  });
});

app.use(express.static(__dirname));
server.listen(process.env.PORT || 3030);
