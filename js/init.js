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

  });

  /* Collections */

  var FeedList = Backbone.Collection.extend({
    model: Feed
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
      }, {scope: 'user_groups'});
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
    initialize : function( group_id ){
      this.group_id = group_id;
      console.log('準備抓社團 ' + group_id + ' 的資料');
      this.$el.removeClass('hide');
      this.fetchFB();
    },
    fetchFB: function(){
      this.fb_data = [];
      var that = this;
      FB.api('/' + this.group_id + '/feed', function(data){
        that.data.concat(data);

      });
    }
  });

});
