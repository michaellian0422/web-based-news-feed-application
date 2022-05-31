function find_news_n_pages_check_login() {
  check_login;
  find_news; /* return Json files */
  find_pages;
}

function loadNewsList(pageindex) {
  //clear old record of the child
  document.getElementById("news").innerHTML = "";
  document.getElementById("pageindex").innerHTML = "";
  document.getElementById("login").innerHTML = "";

  let urlParams = new URLSearchParams(window.location.search);
  var xmlhttp = new XMLHttpRequest();
  var keyword = urlParams.get("keyword");
  if (keyword == null) {
    keyword = "";
  }
  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      response = JSON.parse(xmlhttp.responseText);

      var number_of_entries = response.number;
      var news_array = response.result;
      var login_status = response.login_status;

      if (login_status == 0) {
        var loginpage = document.getElementById("login");
        var a = document.createElement("a");
        a.href = "/login?newsID=0";
        a.innerHTML = "Login";
        loginpage.appendChild(a);
      } else {
        var logoutpage = document.getElementById("login");
        var a = document.createElement("a");
        a.href = "#";
        a.onclick = function () {
          logout();
        };
        a.innerHTML = "Logout";
        logoutpage.appendChild(a);
      }
      //News
      var news = document.getElementById("news");
      for (let x of news_array) {
        var news_div = document.createElement("div");
        //Heading
        var h1 = document.createElement("h1");
        var a = document.createElement("a");
        a.href = "/displayNewsEntry?newsID=" + x._id;
        a.innerHTML = x.headline;
        h1.appendChild(a);
        //Time
        var h6 = document.createElement("h6");
        var comment_time = new Date(x.time)
        h6.innerHTML = comment_time.toLocaleString('eu-ES', {hour12: false});

        //Content
        var p = document.createElement("p");
        p.innerHTML = x.content;

        news_div.appendChild(h1);
        news_div.appendChild(h6);
        news_div.appendChild(p);
        news.appendChild(news_div);
      }
      //Page_index
      if (number_of_entries==0)
      {
        var total_pages=0;
      }
      else
      {
      var total_pages = Math.ceil(number_of_entries / 5);
      }
      var pageindex_div = document.getElementById("pageindex");
      for (let i = 1; i <= total_pages; i++) {
        var page_div = document.createElement("a");
        page_div.innerHTML = i;
        page_div.href="#";

        if (i != pageindex) {
          page_div.onclick = function () {
            loadNewsList(i);
          };
        }
        else{
          page_div.id ="active";
        }
        pageindex_div.appendChild(page_div);
      }
    }
  };
  xmlhttp.open(
    "GET",
    "retrievenewslist?keyword=" + keyword + "&page=" + pageindex,
    true
  );
  xmlhttp.send();
}

function login() {
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;
  if (username == "" || password == "") {
    alert("Please enter username and password");
  } else {
    var request = "handleLogin?username=" + username + "&password=" + password;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", request, true);
    xmlhttp.send();
    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        if (xmlhttp.responseText == "login success") {
          var loginpart = document.getElementById("login_part");
          loginpart.innerHTML = "You have successfully logged in";
        }
        else{
          document.getElementById("login_message").innerHTML = xmlhttp.responseText;
        }
      }
    };
  }
}

function logout() {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", "handleLogout", true);
  xmlhttp.send();
  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      var loginpage = document.getElementById("login");
      loginpage.innerHTML = "";
      var loginpage = document.getElementById("login");
      var a = document.createElement("a");
      a.href = "/login?newsID=0";
      a.innerHTML = "Login";
      loginpage.appendChild(a);
    }
  };
}

function postComment() {
  if (document.getElementById("tocomment_comment").value==""){
    alert("No comment has been entered");
  }
  else{
  let urlParams = new URLSearchParams(window.location.search);
  var text = document.getElementById("tocomment_comment").value;
  var newsID = urlParams.get("newsID");
  const currenttime = new Date();
  var latest_posttime = document.getElementById("commenttime");
  if (latest_posttime != null)
  {
    var latest_posttime = document.getElementById("commenttime").innerHTML;
  }
  latest_posttime = new Date(latest_posttime);
  var comments_part = document.getElementById("comments")
  var xmlhttp = new XMLHttpRequest();
  var request = {
    text: text,
    newsID: newsID,
    currenttime: currenttime,
    latest_posttime: latest_posttime,
  };
  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      var response = JSON.parse(xmlhttp.responseText);
      for (let v of response) {
        var c = document.createElement("div");
        c.id = "comment";
        c.className = "css-comment";
        var img_div = document.createElement("div");
        img_div.className = "css-img-comment";
        var img = document.createElement("img");
        img.className="css-ava-comment"
        img.src = v.icon;
        img.width = "100";
        img.height = "100";
        img_div.appendChild(img);
        c.appendChild(img_div);
        var comment_content = document.createElement("div");
        comment_content.className = "css-comment-content";

        var p = document.createElement("p");
        p.innerHTML = v.name;
        p.id = "username";
        p.className="css-comment-name"
        comment_content.appendChild(p);

        var p2 = document.createElement("p");
        p2.id = "commenttime";
        p2.className = "css-comment-time";
        var date = new Date(v.time);
        (p2.innerHTML =
          date.toLocaleString('eu-ES', {hour12: false}) +
          `.${date.getMilliseconds()}`),
        comment_content.appendChild(p2);

        var p3 = document.createElement("p");
        p3.id = "comment_content";
        p3.className = "css-comment-text";
        p3.innerHTML = v.comment;
        comment_content.appendChild(p3);
        
        c.appendChild(comment_content);
        
        comments_part.insertBefore(c, comments.firstChild);
        document.getElementById("tocomment_comment").value = '';
      }
    }
  };
  xmlhttp.open("POST", "handlePostComment", true);
  xmlhttp.setRequestHeader("Content-type", "application/json");
  xmlhttp.send(JSON.stringify(request));
}
}
