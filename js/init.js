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
    js.src = "https://connect.facebook.net/zh_TW/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));


  /* Models */

  var Feed = Backbone.Model.extend({
    initialize: function() {
      console.log(this);
    }
  });

  var Picture = Backbone.Model.extend({
    initialize: function() {

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

  var PictureList = Backbone.Collection.extend({
    model: Picture
  });

  var UserList = Backbone.Collection.extend({
    model: User
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
        console.log('已經登入');
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
      console.log(this.$el.find('select').val());
      this.remove();
      sliderView = new SliderView(this.$el.find('select').val());
    }
  });

  var SliderView = Backbone.View.extend({
    el: $('#slider_view'),
    fb_data: [],
    fb_images: {},
    feedList: new FeedList(),
    initialize : function( group_id ){
      var that = this;
      this.group_id = group_id;
      this.$el.removeClass('hide');
      this.go();
    },
    go: function(){
      var that = this;
      this.fetchFB().done(function(data){

        console.log('社團 ' + that.group_id + ' 的資料抓取完成');

        that.feedList.add(data);
        console.log(that.feedList);
        window.setTimeout(function(){
          that.go();
        }, 10000);
      });
    }
    ,
    fetchFB: function(){
      this.fb_data = [];
      var that = this;
      var defered = $.Deferred();

      console.log('開始抓社團 ' + that.group_id + ' 的資料');

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
