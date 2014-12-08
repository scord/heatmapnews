function initialize() {
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
            $(".country").text(a.location[0]);
        }
        viewinfobar();
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
            opacity: "0.9"
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
        opacity: "0.9"
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
        disableDefaultUI: true,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.BOTTOM_CENTER
        },
        zoomControl: true,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.SMALL,
            position: google.maps.ControlPosition.RIGHT_CENTER
        }
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
        openItem($(this));
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
            width: "250px"
        }, 300);
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
                weight: Math.pow(articles[i].fields.importance, 0.3 )
            });
        }

        timelapse(new google.maps.MVCArray(points));
    }).fail(function() {
        window.alert("Please enter a valid date as DD/MM/YYYY.");
    });
}

function timelapse(e) {
    new_heatmap.set("opacity", 0);
    new_heatmap.setData(e);
    heatmap.set("opacity", 0.8);
    var t = 0;
    var n = 0.8;
    var r = setInterval(function() {
        t += 0.01;
        n -= 0.01;
        new_heatmap.set("opacity", t);
        heatmap.set("opacity", n);
        if (t >= 0.8) {
            heatmap.setData(e);
            setTimeout(function() {
                heatmap.set("opacity", 0.8);
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
    var t = [{
        featureType: "water",
        stylers: [{
            color: "#A3E0FF"
        }, {
            lightness: 52
        }, {
            saturation: -70
        }, {
            gamma: 0.1
        }]
    }, {
        stylers: [{
            saturation: -75
        }, {
            hue: "#272f32"
        }, {
            lightness: -55
        }, {
            gamma: 0.8
        }]
    }, {
        elementType: "labels",
        stylers: [{
            visibility: "on"
        }]
    }, {
        featureType: "administrative",
        elementType: "geometry",
        stylers: [{
            visibility: "on"
        }]
    }, {
        featureType: "administrative",
        elementType: "labels.text.fill",
        stylers: [{
            color: "#9f9f9f"
        }]
    }, {
        featureType: "administrative",
        elementType: "labels.text.stroke",
        stylers: [{
            color: "#3e3e3e"
        }]
    }, {
        featureType: "administrative.province",
        elementType: "all",
        stylers: [{
            visibility: "off"
        }]
    }];
    e.setOptions({
        styles: t
    });
    heatmap = new google.maps.visualization.HeatmapLayer();
    heatmap.setMap(e);
    heatmap.set("opacity", 0.9);
    heatmap.set("radius", 60);
    var grad = ["rgba(225, 210, 113, 0)", "rgba(225, 210, 113, 1)", "rgba(251, 248, 234, 1)"];
    heatmap.set("gradient", grad);
    new_heatmap = new google.maps.visualization.HeatmapLayer();
    new_heatmap.setMap(e);
    new_heatmap.set("opacity", 0.9);
    new_heatmap.set("radius", 60);
    new_heatmap.set("gradient", grad);
}
var heatmap = [];
var date = "now";
var articleIndex = 0;
var latLng = [];
var map = [];
var new_heatmap = [];
google.maps.event.addDomListener(window, "load", initialize);
