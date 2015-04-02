function initialize() {
    date = "now";
    displayMap();
    displayArticles();
}

function getArticle() {
    $.get("/news/articles/", {

        index: articleIndex,
        date: date,
        lat: latLng.lat(),
        lng: latLng.lng()
    }, function(data) {
        if (data == "[]") {
            closeWindow($("#article-window"));
            closeWindow($("#about-window"));
            closeinfobar();
            return;
        }
        closeWindow($("#about-window"));
        articles = $.parseJSON(data);
        var a;
        a = articles[0].fields;
        if (articleIndex === 0) {
            $(".country").text(a.location[0].toUpperCase() + " " + date.replace(/-/g, "/").toUpperCase());
        }
        viewinfobar();
        if (articleIndex == 0)
            $("#prev-article").hide();
        else
            $("#prev-article").show();
        $("#article-image").attr("src", a.image_url);
        $("#article-summary").text(a.summary);
        $("#article-title").text(a.title + " - " + a.provider);
        $("#article-title").attr("href", a.article_url);
        $("#cluster-link").attr("href", a.cluster_url);
        openWindow($("#article-window"));
    });
}

function openWindow(e) {
    if (e.hasClass("is-closed")) {
        e.slideDown({
            duration: 100,
            queue: false
        });
        e.animate({
            opacity: "1.0"
        }, {
            duration: 250,
            queue: false
        });
        e.addClass("is-open");
    }
}

function closeWindow(e) {
    if (e.hasClass("is-open")) {
        e.slideUp({
            duration: 100,
            queue: false
        });
        e.animate({
            opacity: "0.0"
        }, {
            duration: 100,
            queue: false
        });
        e.addClass("is-closed");
    }
}

function viewinfobar() {
    $("#infobar").slideDown({
        duration: 300,
        queue: false
    });
    $("#infobar").animate({
        opacity: "0.999"
    }, {
        duration: 25,
        queue: false
    });
}

function getinfobar() {
    $.get("/news/topArticles/", {
        lat: latLng.lat(),
        lng: latLng.lng()
    }, function(data) {
        if (data == "[]") {
            return;
        }
        articles = $.parseJSON(data);
        closeWindow($("#article-window"));
        var d = articles[0].fields.date;
        var ds = t.split("T")[0].split("-");
        var fd = ds[2] + "/" + ds[1] + "/" + ds[0];
        for (var i in articles) {
            $("#infobar-list").append("<li><p>" + articles[i].fields.title + "</p><p>" + fd + "</p></li>");
        }
    });
}

function displayMap() {
    var mapOptions = {
        center: new google.maps.LatLng(30, 0),
        zoom: 3,
        minZoom: 3,
        maxZoom: 4,
        disableDefaultUI: true
    };
    map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
    google.maps.event.addListener(map, "click", function(e) {
        latLng = e.latLng;
        $("#infobar-list").empty();
        articleIndex = 0;
        getArticle();
    });
    $("#next-article").click(function(e) {
        e.preventDefault();
        articleIndex += 1;
        getArticle();
    });
    $("#prev-article").click(function(e) {
        e.preventDefault();
        articleIndex -= 1;
        getArticle();
    });
    $("#refresh").click(function() {
        date = "now";
        closeItem($("#date"));
        displayArticles();
    });
    $("#date").click(function() {
        if ($("#date").hasClass("is-closed")) {
            $("#date-input").focus();
            openItem($(this));
        }
    });
    $("#date-input").keyup(function(e) {
        var key = e.keyCode || e.which;
        if (key == 13) {
            submitDate();
        } else if (!(key == 8 || key == 46)) {
            if ($(this).val().length == 2) {
                $(this).val($(this).val() + "/");
            } else if ($(this).val().length == 5) {
                $(this).val($(this).val() + "/");
            }
        }
    });
    $("#go").click(function() {
        submitDate();
    });
    $("#article-close").click(function() {
        articleIndex = 0;
        closeWindow($("#article-window"));
        closeinfobar();
    });
    $("#about-close").click(function() {
        closeWindow($("#about-window"));
    });
    $("#about").click(function() {
        displayAboutWindow();
    });
    $("#back").click(function() {
        days += 1;
        $.get("/locations/", {
            days: days
        }, function(e) {
            articles = $.parseJSON(e);
            display(articles);
        });
    });
    $("#forward").click(function() {
        days -= 1;
        $.get("/locations/", {
            days: days
        }, function(e) {
            articles = $.parseJSON(e);
            display(articles);
        });
    });
    $("#infobar-btn").click(function() {
        getinfobar();
    });
    setStyle(map);
}

function submitDate() {
    dateInput = $("#date-input").val();
    var e = /^([0-9][0-9])\/([0-9][0-9])\/([0-9]{3}[1-9])$/;
    if (e.test(dateInput)) {
        date = dateInput.replace(/\//g, "-");
        closeItem($("#date"));
        displayArticles();

    } else {
        window.alert("Please enter a valid date as DD/MM/YYYY.");
    }
}

function displayAboutWindow() {
    closeWindow($("#article-window"));
    openWindow($("#about-window"));
}

function openItem(e) {
    if (e.hasClass("is-closed")) {
        e.removeClass("is-closed");
        e.addClass("is-open");
        e.animate({
            width: "180px"
        }, 250);
    }
}

function closeItem(e) {
    e.animate({
        width: "100px"
    }, 300, function() {
        e.removeClass("is-open");
        e.addClass("is-closed");
    });
}

function displayArticles() {
    if (loading)
        return;

    var articles = [];
    $.get("/news/locations/", {
        date: date
    }, function(t) {
        if (t == "[]") {
            window.alert("Sorry, we don't have any data for this date.");
            return;
        }
        articles = $.parseJSON(t);
        var points = [];
        for (var i in articles) {
            latlng = articles[i].fields.location.slice(1, 3);
            points.push({
                location: new google.maps.LatLng(latlng[0], latlng[1]),
                weight: Math.pow(articles[i].fields.importance, 0.4 )
            });
        }

        timelapse(new google.maps.MVCArray(points));
    });
}

function timelapse(e) {
    new_heatmap.set("opacity", 0);
    new_heatmap.setData(e);
    heatmap.set("opacity", 0.7);
    var t = 0;
    var n = 0.7;
    var r = setInterval(function() {
        t += 0.01;
        n -= 0.01;
        new_heatmap.set("opacity", t);
        heatmap.set("opacity", n);
        if (t >= 0.7) {
            heatmap.setData(e);
            setTimeout(function() {
                heatmap.set("opacity", 0.7);
                new_heatmap.set("opacity", 0);
                new_heatmap.setData([]);
                clearInterval(r);
            }, 50);
        }
    }, 10);
}

function closeinfobar() {
    $("#infobar").slideUp({
        duration: 100,
        queue: false
    });
    $("#infobar").animate({
        opacity: "0.0"
    }, {
        duration: 100,
        queue: false
    });
}

function setStyle(e) {
    var t = [
  {
    "featureType": "water",
    "stylers": [
      { "hue": "#00b2ff" },
      { "gamma": 0.78 },
      { "saturation": -84 },
      { "lightness": -75 }
    ]
  },{
    "featureType": "landscape.natural",
    "stylers": [
      { "lightness": 20 },
      { "saturation": -77 },
      { "gamma": 0.18 }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry.fill",
    "stylers": [
      { "visibility": "off" }
    ]
  },{
    "featureType": "water",
    "elementType": "labels",
    "stylers": [
      { "visibility": "off" }
    ]
  }
];
    e.setOptions({
        styles: t
    });
    heatmap = new google.maps.visualization.HeatmapLayer();
    heatmap.setMap(e);
    heatmap.set("opacity", 0.70);
    heatmap.set("radius", 40);
    var grad = ["rgba(72, 190, 226, 0)", "rgba(72, 190, 226, 1)", "rgb(100, 203, 230)", "rgb(138, 217, 233)", "rgb(169, 227, 236)", "rgb(202, 232, 237)", "rgb(212, 231, 234)", "rgba(255, 255, 255, 1)"];
    heatmap.set("gradient", grad);
    new_heatmap = new google.maps.visualization.HeatmapLayer();
    new_heatmap.setMap(e);
    new_heatmap.set("opacity", 0.70);
    new_heatmap.set("radius", 40);
    new_heatmap.set("gradient", grad);
}
var loading = false;
var heatmap = [];
var date = "now";
var articleIndex = 0;
var latLng = [];
var map = [];
var new_heatmap = [];

$(document).ready(initialize);
