$(function(){
  window.fbAsyncInit = function() {
    FB.init({
      appId   : '602383836559427',
      xfbml   : true,
      version : 'v2.2'
    });

    FB.getLoginStatus(function(response){
      var loginView = new LoginView();
    });
  };

  (function(d, s, id){
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/zh_TW/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));


  /* Models */

  var Feed = Backbone.Model.extend({
    initialize: function() {
      var feed = this;
      if(this.attributes.id) {
        console.log("Feed initialize");
        if(this.attributes.picture) {
          FB.api('/' + this.attributes.link.match('fbid=([0-9]+)')[1] , function(data){
            console.log("Feed picture loaded");
            feed.set({"image":data.images[0]});
          });
        }
        this.reload();
      }
    },
    reload: function(){
      var feed = this;
      FB.api("/" + feed.attributes.id, function(data){
        console.log("load:" + data.id);
        feed.set(data);
        window.setTimeout(function(){
          feed.reload();
        }, Math.random() * 60000);
      })
    }
  });

  var Picture = Backbone.Model.extend({
    initialize: function() {
      this.defered = $.Deferred();
      var pic = this;
      FB.api('/' + this.attributes.id , function(data){
        pic.set({"image":data.images[0]});
      });
    }
  });

  var User = Backbone.Model.extend({
    initialize: function() {
    }
  });

  /* Collections */

  var FeedList = Backbone.Collection.extend({
    model: Feed,
    group_id: null,
    initialize: function(group_id){
      console.log("Feed List initialize");
      this.group_id = group_id;
      this.reload();
    },
    reload: function(){
      var feedList = this;
      FB.api('/' + feedList.group_id + '/feed', function(feeds){
        console.log("feed List reload");
        feedList.add(feeds.data);
        window.setTimeout(function(){
          feedList.reload();
        }, Math.random() * 30000);
      });
    }
  });

  var PictureList = Backbone.Collection.extend({
    model: Picture,
    check: function(){
      var defereds = [];
      this.each(function(pic) {
        defereds.push(pic.check());
      });
      return $.when.apply($, defereds);
    }
  });

  var pictureList = new PictureList();


  /* Views */

  var LoginView = Backbone.View.extend({
    el: $("#login_view"),
    events: {
      "click .btn-fb-login" : "fb_login"
    },
    initialize : function(){
      this.$el.removeClass('hide');
    },
    fb_login : function(){
      var that = this;
      FB.login(function(response){
        that.remove();
        group_selector_view = new GroupSelectorView;
      }, {scope: 'user_groups,user_photos'});
    }
  });

  var GroupSelectorView = Backbone.View.extend({
    el: $("#group_selector_view"),
    events: {
      "click .btn-fb-group" : "group_click"
    },
    initialize : function(){
      var that = this;
      FB.api('/me?fields=id,name,groups', function(response){
        var groups = response.groups.data;
        for (var i = groups.length - 1; i >= 0; i--) {
          that.$el.find('select').append(that.template(groups[i]));
        };
        that.$el.removeClass('hide');
      });
    },
    template : _.template($('#group_item_template').html()),
    group_click : function(){
      this.remove();
      console.log("選擇社團：" + this.$el.find('select').val());
      sliderView = new SliderView(this.$el.find('select').val());
    }
  });

  var FeedView = Backbone.View.extend({
    initialize: function(id){
      console.log("Feed View initialize");
      this.model = new Feed(id);
      this.model.on("change", function(){
        console.log("feedView Change Event");
      }, this);
    }
  });

  var SliderView = Backbone.View.extend({
    el: $('#slider_view'),
    initialize : function(group_id){
      console.log("Slider View initialize");
      this.model = new FeedList(group_id);
      this.$el.removeClass('hide');
      this.listenTo(this.model, "add", this.addFeed);
    },
    addFeed: function(data){
      console.log("add:");
      console.log(this);
      console.log(data)
    }
    // template : _.template($('#slider_item').html()),
  });

});

// effect: "fade",
// animSpeed: 500,
// pauseTime: 10000,
// directionNav: false,
// controlNav: false,
// controlNavThumbs: false,
// pauseOnHover: false
