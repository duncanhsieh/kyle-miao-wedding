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
      if(this.attributes.picture) {
        pictureList.add({ "id" : this.attributes.link.match('fbid=([0-9]+)')[1]});
        this.set({"picture_id" : this.attributes.link.match('fbid=([0-9]+)')[1]});
      } else {
        this.set({"picture_id" : null});
      }
      console.log(this.attributes);
      // if(this.attributes.from) {
      //   userList.add(this.attributes.from);
      // }
    }
  });

  var Picture = Backbone.Model.extend({
    defered : null,
    initialize: function() {
      this.defered = $.Deferred();
      var pic = this;
      FB.api('/' + this.attributes.id , function(data){
        pic.set({"image":data.images[0]});
        pic.defered.resolve(true);
      });
    },
    check: function(){
      if(this.attributes.image) {
        return true;
      } else {
        return this.defered.promise();
      }
    }
  });

  var User = Backbone.Model.extend({
    initialize: function() {
    }
  });

  /* Collections */

  var FeedList = Backbone.Collection.extend({
    model: Feed
  });

  var feedList = new FeedList();

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

  // var UserList = Backbone.Collection.extend({
  //   model: User
  // });

  // var userList = new UserList();


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
      sliderView = new SliderView(this.$el.find('select').val());
    }
  });

  var SliderView = Backbone.View.extend({
    el: $('#slider_view'),
    fb_data: [],
    fb_images: {},
    initialize : function( group_id ){
      var that = this;
      this.group_id = group_id;
      this.$el.removeClass('hide');
      this.go();
    },
    template : _.template($('#slider_item').html()),
    go: function(){
      var that = this;
      this.fetchFB().done(function(data){
        feedList.add(data);

        pictureList.check().done(function(){
          var pictures = pictureList.toJSON();
          var picturesObj = {};
          for (var i = pictures.length - 1; i >= 0; i--) {
            picturesObj[pictures[i].id] = pictures[i].image;
          };
          var feeds = {"feeds": feedList.toJSON(), "pictures": picturesObj};
          console.log(feeds);
          var template = that.template(feeds);
          that.$el.find('.center-content').html(template);
          that.$el.find('#slider').nivoSlider({
            effect: "fade",
            animSpeed: 500,
            pauseTime: 10000,
            directionNav: false,
            controlNav: false,
            controlNavThumbs: false,
            pauseOnHover: true
          });
        });

        // window.setTimeout(function(){
        //   that.go();
        // }, 10000);
      });
    }
    ,
    fetchFB: function(){
      this.fb_data = [];
      var that = this;
      var defered = $.Deferred();

      var fetchMore = function(url){
        $.get(url).done(function(data){
          that.fb_data = that.fb_data.concat(data.data);
          if(data.paging && data.paging.next && that.fb_data.length < 100) {
            fetchMore(data.paging.next);
          } else {
            defered.resolve(that.fb_data);
          }
        }).error(function(){
          defered.reject('jQuery GET Error');
        });
      }

      FB.api('/' + this.group_id + '/feed', function(data){
        that.fb_data = that.fb_data.concat(data.data);
        if(data.paging && data.paging.next) {
          fetchMore(data.paging.next);
        } else {
          defered.resolve(that.fb_data);
        }
      });

      return defered.promise();
    }
  });

});

// effect: "fade",
// animSpeed: 500,
// pauseTime: 10000,
// directionNav: false,
// controlNav: false,
// controlNavThumbs: false,
// pauseOnHover: false
