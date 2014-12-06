var heatmap = [];
var date = "now";
var articleIndex = 0;
var latLng = [];
var map = [];

function initialize() {
    displayMap();
    displayArticles();
}


function getArticle() {
    $.get('/articles/', {index: articleIndex, date: date, lat: latLng.lat(), lng: latLng.lng()}, function(data){

                if (data == "[]") {
                    closeWindow();
                    return;
                }

                articles = $.parseJSON(data);
                var a;
              
                a = articles[0]['fields'];
           
                $("#article-image").attr("src", a['image_url']);
                $("#article-summary").text(a['summary']);
                $("#article-title").text(a['title']);
                $("#article-title").attr('href', a['article_url']);
                $("#cluster-link").attr('href', a['cluster_url']);
                
                $("#window").slideDown({duration:100, queue: false});
                
                $("#window").animate({
                    opacity: "0.9"
                }, {duration:250, queue: false});
                    
            });
}

function displayMap() {

    var mapOptions = {
        center: new google.maps.LatLng(30, 0),
        zoom: 3,
        minZoom: 3,
        maxZoom: 3,

        //mapTypeId: google.maps.MapTypeId.HYBRID,
        disableDefaultUI: true,
    
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.BOTTOM_CENTER
        }

    };

    map = new google.maps.Map(document.getElementById("map-canvas"),
        mapOptions);

    google.maps.event.addListener(map, 'click', function(event) {
            latLng = event.latLng
            getArticle();
    });

    $("#next-article").click(function() {
        articleIndex+=1;
        getArticle();
    });

    $("#prev-article").click(function() {
        articleIndex-=1;
        getArticle();
    })

    $("#refresh").click(function() {
        date = "now"
        displayArticles();
    });

    $("#date").click(function() {  
        toggleDate();
    });

    $("#go").click(function() {
        date = $("#date_input").val().replace(/\//g, "-")
        displayArticles();
    })

    $("#back").click(function() {
        days += 1
        $.get('/locations/', {days: days}, function(data){
            articles = $.parseJSON(data);
            display(articles);
        });
    });

    $("#forward").click(function() {
        days -= 1
        $.get('/locations/', {days: days}, function(data){
            articles = $.parseJSON(data);
            display(articles);
        });
    });

    setStyle(map);


}

function toggleDate() {
    openItem($("#date"));
}

function openItem(item) {
    if (item.hasClass("closed")) {
        item.removeClass("closed");
        item.addClass("open");
        item.animate({
            width: "300px"
        }, 300);
    } 
}

function closeItem(item) {
    item.animate({
            width: "100px"
        }, 300, function() {
            item.removeClass("open");
            item.addClass("closed");
        });
}

function displayArticles() {

    var articles = [];
    $.get('/locations/', {date: date}, function(data){
        articles = $.parseJSON(data);
        var locations = [];
        for (var i in articles) {
            latlng = articles[i]['fields']['location']
            locations.push({location: new google.maps.LatLng(latlng[0], latlng[1]), weight: Math.sqrt(articles[i]['fields']['importance'])});
        }
        var pointArray = new google.maps.MVCArray(locations);
        heatmap.setData(pointArray);
     
    });
}

function closeWindow() {
    $("#window").slideUp({duration:100, queue: false});

        $("#window").animate({
            opacity: "0.0"
        }, {duration:100, queue: false});

    articleIndex = 0;
}

function setStyle(map) {
    var styles = [
      {
        "featureType": "water",
        "stylers": [
            {
                "color":  '#A3E0FF'
            },
            {
                "lightness": 52
            },
            {
                "saturation": -70
            },
            {
                "gamma": 0.25
            }
        ]
    },
    {
        "stylers": [
     
            {
                "saturation": -70
            },
            {
                "gamma": 0.25
            }
        ]
    },
    {
      elementType: 'labels',
      stylers: [
        { visibility: 'on' }
      ]
    },

    {
        featureType: "administrative",
        elementType: "geometry",
        stylers: [
            { visibility: 'off' }
        ]
    },
    {
        featureType: "administrative.province",
        elementType: "all",
        stylers: [
            { visibility: 'off' }
        ]
    },

    ];

    map.setOptions({styles: styles});

    heatmap = new google.maps.visualization.HeatmapLayer();
    heatmap.setMap(map);
    heatmap.set('opacity', 0.8);
    heatmap.set('radius', 80);

    var gradient = [
        'rgba(107, 255, 154, 0)',
        'rgba(107, 255, 154, 1)',
        'rgba(255, 233, 107, 1)',
        'rgba(255, 106, 106, 1)'
    ]
    heatmap.set('gradient', gradient);
}

google.maps.event.addDomListener(window, 'load', initialize);
