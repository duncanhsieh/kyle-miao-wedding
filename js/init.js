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
        if(this.attributes.likes) {
          var likes = this.attributes.likes.data.length;
          this.set('like_count', likes);
        } else {
          this.set('like_count', 0);
        }
        if(this.attributes.picture) {
          FB.api('/' + this.attributes.link.match('fbid=([0-9]+)')[1] , function(response){
            if (!response || response.error) {
              console.log('feed image Error occured');
            } else if(response.images) {
              feed.set({"image":response.images[0]});
            }
          });
        }
        this.reload();
      }
    },
    reload: function(){
      var feed = this;
      FB.api("/" + feed.attributes.id + "/likes?summary=true", function(response){
        if (!response || response.error) {
          console.log('feed Error occured');
        } else {
          if(response.summary.total_count) {
            var likes = response.summary.total_count;
            var like_count = 0;
            if(likes > 27) {
              like_count = 49;
            }
            if(likes > 50) {
               like_count = 50;
            }
            feed.set('like_count', like_count);
          }
        }
        window.setTimeout(function(){
          feed.reload();
        }, Math.random() * 60000);
      })
    }
  });

  /* Collections */

  var FeedList = Backbone.Collection.extend({
    model: Feed,
    group_id: null,
    initialize: function(group_id){
      this.group_id = group_id;
      this.reload();
    },
    reload: function(){
      var feedList = this;
      FB.api('/' + feedList.group_id + '/feed', function(response){
        if (!response || response.error) {
          console.log('feedList Error occured');
        } else {
          feedList.add(response.data);
        }
        window.setTimeout(function(){
          feedList.reload();
        }, Math.random() * 30000);
      });
    }
  });

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
      var sliderView = new SliderView(this.$el.find('select').val());
    }
  });

  var FeedView = Backbone.View.extend({
    template : _.template($('#feed_item_template').html()),
    initialize: function(){
      this.render();
      this.listenTo(this.model, "change:image", this.imageChanged);
      this.listenTo(this.model, "change:like_count", this.likesChanged);
    },
    render : function () {
      this.$el.html(this.template(this.model.toJSON()));
      return this;
    },
    imageChanged: function(feed){
      this.$el.find('.center-content').css({
        "background-image": 'url(' + feed.attributes.image.source + ')'
      });this.$el.css({
        "background": 'rgba(0,0,0,0.33)'
      });
    },
    likesChanged: function(feed){
      var like = feed.attributes.like_count;
      this.$el.find('.animation-wrap').attr({"data-like":like});
    }
  });

  var SliderView = Backbone.View.extend({
    el: $('#slider_view'),
    initialize : function(group_id){
      this.model = new FeedList(group_id);
      this.$el.removeClass('hide');
      this.listenTo(this.model, "add", this.addFeed);

    },
    addFeed: function(feed){
      var that = this;
      that.$el.append('<div id="feed_'+feed.attributes.id+'" class="feed-view"></div>');
      var feedView = new FeedView({el: $('#feed_'+feed.attributes.id), model: feed});

      if(this.is_run) {
      } else {
        this.$el.find('.feed-view:first-child').addClass('active');
        var next = this.$el.find('.active');
        this.is_run = true;
        next.fadeIn(1000, function(){
          next.addClass('active');
          window.setTimeout(function(){
            that.runner();
          }, 10000);
        });
      }
    },
    runner: function(){
      var that = this;
      var target = this.$el.find('.active');
      var next = target.next();
      if(next.length == 0) {
        next = this.$el.find('.feed-view:first-child');
      }
      target.fadeOut(1000, function(){
        target.removeClass('active');
        next.fadeIn(1000, function(){
          next.addClass('active');
          window.setTimeout(function(){
            that.runner();
          }, 10000);
        });
      });
    }
  });

});
