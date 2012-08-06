// app.clipapp.face.js

App.ClipApp.Face = (function(App, Backbone, $){
  var Face = {};
  var user_id = null;

  var P = App.ClipApp.Url.base;
  var UserModel = App.Model.extend({
    defaults:{
      name:"",
      id:"",
      following:"",
      follower:"",
      face:""
    },
    url:function(){
      return App.util.unique_url(P+"/user/"+ this.id + "/info");
    }
  });

  var FaceView = App.ItemView.extend({
    tagName: "div",
    className: "userface-view",
    template: "#userface-view-template",
    events: {
      "click #user_zhui": "followAction",
      "click #user_stop": "stopAction",
      "click .user_list": "userList",
      "click .following": "following",
      "click .follower": "follower",
      "mouseenter .user_head": "mouseEnter",
      "mouseleave .user_head": "mouseLeave",

      "focus #input_keyword" : "cleanDefault",
      "blur #input_keyword"  : "blurAction",
      "click #input_keyword" : "inputAction",
      "click .search_btn"    : "queryUser"
    },
    mouseEnter: function(e){
      $(e.currentTarget).children(".user_i").show();
    },
    mouseLeave: function(e){
      $(e.currentTarget).children(".user_i").hide();
    },
    followAction: function(){
      App.vent.trigger("app.clipapp.followerlist:refresh");
      App.vent.trigger("app.clipapp:follow",this.model.id,'*');
    },
    stopAction: function(){
      App.vent.trigger("app.clipapp.followerlist:refresh");
      App.vent.trigger("app.clipapp:unfollow",this.model.id,'*');
    },
    userList: function(e){
      App.vent.trigger("app.clipapp:usershow", user_id);
    },
    following: function(){
      App.vent.trigger("app.clipapp:showfollowing", user_id);
    },
    follower: function(){
      App.vent.trigger("app.clipapp:showfollower", user_id);
    },
    cleanDefault: function(e){
      var def = null;
      if(App.util.self(user_id)){
	def = _i18n('userface.mysearch');
      }else{
	def = _i18n('userface.search');
      }
      $(e.currentTarget).val($.trim($(e.currentTarget).val()) == def ? "" :$(e.currentTarget).val() );
    },
    blurAction:function(e){
      var def = null;
      if(App.util.self(user_id)){
	def = _i18n('userface.mysearch');
      }else{
	def = _i18n('userface.search');
      }
      $(e.currentTarget).val( $(e.currentTarget).val() == "" ? def : $(e.currentTarget).val() );
    },
    inputAction: function(e){
      var view = this;
      var id = e.currentTarget.id;
      $(".text").unbind("keydown");
      $(".text").keydown(function(e){
	if(e.keyCode==13){ // 响应回车事件
	  view.queryUser();
	}
      });
    },
    queryUser: function(){
      var word = $.trim(this.$("#input_keyword").val());
      var def = null;
      if(App.util.self(user_id))def = _i18n('userface.mysearch');
      else def = _i18n('userface.search');
      if(word == def) word = null;
      App.vent.trigger("app.clipapp:userquery", user_id, word);
    }
  });

  var getUser=function(uid,callback){
    var url = "";
    if(uid == App.util.getMyUid()){
      // url中带上随机数 防止ie的缓存导致不能向服务器发出请求
      url = P + "/my/info";
    }else{
      url = P + "/user/"+ uid + "/info";
    }
    var user=new UserModel();
    user.fetch({url:App.util.unique_url(url)});
    user.onChange(function(user){
      callback(user);
    });
  };

  Face.showUser = function(uid){
    user_id = uid;
    if(uid){
      if(App.util.getMyUid() != uid){
	getUser(uid, function(user){
	  App.ClipApp.Bubb._getUserTags(uid,function(tag,follow){
	    user.set({relation:follow});
	    var faceView = new FaceView({model: user});
	    App.faceRegion.show(faceView);
	  });
	});
      }else{
	var faceView = new FaceView({model: App.ClipApp.Me.me});
	App.faceRegion.show(faceView);
      }
    }else{
      App.faceRegion.close();
    }
  };

  Face.getUserId = function(){
    return user_id;
  };

  App.vent.bind("app.clipapp.face:show", function(uid){
    Face.showUser(uid);
  });

  App.vent.bind("app.clipapp.face:reset", function(uid){
    if(/my/.test(window.location.hash))
      Face.showUser(uid);
  });

  return Face;
})(App, Backbone, jQuery);