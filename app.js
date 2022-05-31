var express = require("express");
var cookieParser = require("cookie-parser");
var app = express();
var monk = require("monk");
const { response } = require("express");
var db = monk("127.0.0.1:27017/a1db");

app.use(cookieParser());
app.use(express.json());

app.use(express.static("public"), function (req, res, next) {
  req.db = db;
  next();
});

app.get("/login", (req, res) => {
  var newsID = req.query.newsID;
  var response = '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Log in -Assignment1 newsfeed</title><link rel="stylesheet" href="stylesheets/style.css"><link rel="stylesheet" href="stylesheets/style.css"><script src="javascripts/script.js"></script></head>';
  response += '<body><div id="loginbody"><div id="login_part"><div class="login_messag" id="login_message">You can log in here</div>';
  response += '<div class="login_ui"> <label for="username">User Name:</label>';
  response += '<input type="text" id="username" name="username"></div>';
  response += '<div class="login_ui"><label for="password">Password:  </label>';
  response += '<input type="password" id="password" name="password" ></div>';
  response += '<div class="submit_button"><input class="login_submit" type="submit" value="Submit" onclick="login()"></div></div>';
  if (newsID == "0") {
    response +=
      '<div id="login_back"><a href="/newsfeed.html">Go back</a></div></div>';
  } else if (parseInt(newsID) > 0) {
    response +=
      '<div id="login_back"><a href="/displayNewsEntry?newsID=' +
      newsID +
      '">Go back</a></div></div>';
  }
  res.send(response);
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/" + "newsfeed.html");
  var db = req.db;
});

app.get("/handleLogin", (req, res) => {
  var username = req.query.username;
  var password = req.query.password;
  var usercol = db.get("userList");
  usercol
    .findOne({ name: { $regex: "^" + username + "\\b", "$options": "i"} } )
    .then((userdata) => {
      if (userdata == null) {
        res.send("Username is incorrect");
      } else {
        if (userdata.password == password) {
          res.cookie("userID", userdata._id);
          res.send("login success");
        } else {
          res.send("Password is incorrect");
        }
      }
    });
});

app.get("/displayNewsEntry", (req, res) => {
  var newsID = monk.id(req.query.newsID);
  var newscol = db.get("newsList");
  var userscol = db.get("userList");
  var response =
    '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>News - Assignment1 newsfeed</title><link rel="stylesheet" href="stylesheets/style.css"><script src="javascripts/script.js"></script></head>';
  newscol.findOne({ _id: newsID }).then((data) => {
    response += '<div class="news"><div class="news_inline_div1"><a href="newsfeed.html">&lt;-</a><div class="news_inline_div2"><h1 id="news_topic">' + data.headline + '</h1>';
    response += "<h6 id='news_time'>" + data.time.toLocaleString('eu-ES', {hour12: false}) + "</h6></div></div>";
    response += '</head><body><div id="news_content">';
    response += "<p style='margin:1%; font-size:16px' >" + data.content + "</p></div></div>";
    response += '<div id="comments">'
    var promise_counter = 0;
    var comments = data.comments;
    var sortedcomments = comments.sort(function (a, b) { return b.time - a.time;});
    //To examine whether it is the last promise in the for-loop
    comment_array = [];
    for (let x in sortedcomments) {
      userscol.findOne({ _id: sortedcomments[x].userID }).then((user) => {
        comment = {
          icon: user.icon,
          name: user.name,
          time: sortedcomments[x].time.toLocaleString() + `.${sortedcomments[x].time.getMilliseconds()}`,
          comment: sortedcomments[x].comment,
        };
        comment_array[x] = comment;
        promise_counter += 1;
        if (promise_counter == sortedcomments.length) {
          for (let y of comment_array) {
            response +=`
            <div id="comment" class="css-comment">
          <div class="css-img-comment">
              <img src="` 
      response += y.icon + `" width="100" height="100" class="css-ava-comment">
          </div>
          <div class="css-comment-content">
              <p id="username" class="css-comment-name">` +y.name;
      response += `</p>
              <p id="commenttime" class="css-comment-time">` + y.time
      response += `</p>
              <p id="comment_content" class="css-comment-text">` + y.comment
      response += `</p>
          </div>    </div>`
          }
          if (req.cookies.userID) {
            response +=
              '</div><div id="tocomment"> <input id="tocomment_comment" type="text">';
            response += '<button class="button_slide slide_downpostbutton" onclick="postComment()">post comment</button>';
          } else {
            response +=
              '<div id="tocomment"> <input disabled id="tocomment_comment" type="text">';
            response +=
              '<a href="login?newsID=' +
              newsID +
              '"><button class="postbutton" >Login to comment</button></a>';
          }
          res.send(response);
        }
      });
    }
    if (sortedcomments.length == 0){
      if (req.cookies.userID) {
        response +=
          '<div id="tocomment"> <input id="tocomment_comment" type="text">';
        response += '<button onclick="postComment()">post comment</button>';
      } else {
        response +=
          '<div id="tocomment"> <input disabled id="tocomment_comment" type="text">';
        response +=
          '<a href="login?newsID=' +
          newsID +
          '"><button>Login to comment</button></a>';
      }
      res.send(response);
    }
  });
});

app.get("/retrievenewslist", (req, res) => {
  var page = req.query.page;
  var keyword = req.query.keyword;
  var newscol = db.get("newsList");
  var number;
  var result;
  var login_status;

  //Sending result length
  newscol
    .find(
      {
        $or: [
          { content: { $regex: ".*" + keyword + ".*", $options: "i" } },
          { headline: { $regex: ".*" + keyword + ".*", $options: "i" } },
        ],
      },
      { sort: { time: -1 } }
    )
    .then((data) => {
      number = data.length;

      newscol
        .aggregate([
          {
            $match: {
              $or: [
                { content: { $regex: ".*" + keyword + ".*", $options: "i" } },
                { headline: { $regex: ".*" + keyword + ".*", $options: "i" } },
              ],
            },
          },

          //to split all the content into 10words simplified content
          {
            $set: {
              content: {
                $reduce: {
                  input: {
                    $slice: [{ $split: ["$content", " "] }, 10],
                  },

                  initialValue: "",
                  in: {
                    $concat: [
                      "$$value",
                      { $cond: [{ $eq: ["$$value", ""] }, "", " "] },
                      "$$this",
                    ],
                  },
                },
              },
            },
          },

          { $sort: { time: -1 } },
          { $skip: (page - 1) * 5 },
          { $limit: 5 },
        ])
        .then((data) => {
          result = data;

          if (req.cookies.userID) {
            login_status = 1;
          } else {
            login_status = 0;
          }
          var response = {number, result, login_status};
          res.json(response);
        });
    });
});

app.get("/handleLogout", (req, res) => {
  res.clearCookie("userID");
  res.send();
});
app.post("/handlePostComment", (req, res) => {
  var comment = req.body.text;
    var newsid = req.body.newsID;
    var userid = req.cookies.userID;
    var commenttime = req.body.currenttime;
    var latest_posttime = req.body.latest_posttime
    latest_posttime = new Date(latest_posttime);
    commenttime = new Date(commenttime);
    var newscol = db.get("newsList");
    var userscol = db.get("userList");
    newscol.findOne({ _id: newsid }).then((data) => 
    {
      var comment_array = data.comments;
      var new_comment = {"userID":monk.id(userid), "time":commenttime, "comment":comment};
      comment_array.push(new_comment);
      newscol.update( {_id:newsid }, {$set:{'comments':comment_array}})
      .then((data) => 

      {
        //Find new comment after update
        newscol.findOne({ _id: newsid }).then((data) =>
        {
          var response_comment =[]; 
          var promise_counter2 = 0; //Ensure all promise completed
          for (let y in data.comments){
            if (data.comments[y].time > latest_posttime){ 
              userscol.findOne({ _id: data.comments[y].userID }).then((user) => 
              {
                response_comment.push({"userID":data.comments[y].userID, "time":data.comments[y].time, "comment":data.comments[y].comment, "name": user.name, "icon": user.icon});
                promise_counter2 +=1;
                if (promise_counter2 == data.comments.length)
                {
                  var sortedcomments = response_comment.sort(function (a, b) { return a.time - b.time;});
                  res.json(sortedcomments);
                }
              });
            }
            else{
              promise_counter2 +=1;
              if (promise_counter2 == data.comments.length)
            {
              var sortedcomments = response_comment.sort(function (a, b) { return a.time - b.time;});
              res.json(sortedcomments);
            }
            }
          }
        })
      }
      )
    });
});

// launch the server with port 8081
var server = app.listen(8081, () => {
  var host = server.address().address;
  var port = server.address().port;
  console.log("a1 app listening at http://%s:%s", host, port);
});
