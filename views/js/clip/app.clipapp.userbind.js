App.ClipApp.UserBind = (function(App, Backbone, $){

  var UserBind = {};
  var P = App.ClipApp.Url.base;
  App.Model.UserBindModel = App.Model.extend({
    url:function(){
      var my = App.ClipApp.getMyUid();
      if(this.get("account")){
	return App.ClipApp.encodeURI(P+"/"+ my +"/oauth/"+this.get("account"));
      }else{
	return App.ClipApp.encodeURI(P+"/"+ my +"/oauth/");
      }
    }
  });
  var UserBindView = App.ItemView.extend({
    tagName : "div",
    className : "bind-view",
    template : "#bind-view-template",
    events : {
      "click .close_w"           : "cancel",
      "click #bind_ok"           : "bindOk",
      "click #user_have"         : "toggleClass",
      "click #user_not"          : "toggleClass",
      "blur #name"          : "blurName",
      "blur #pass"          : "blurPass",
      "focus #name"         : "cleanError",
      "focus #pass"         : "cleanError"
    },
    initialize:function(){
      this.tmpmodel = new App.Model.LoginModel();
      this.bind("@cancel", cancel);
      this.bind("@success", success);
    },
    blurName: function(e){
      var that = this;
      this.tmpmodel.set({name:$("#name").val()}, {
	error:function(model, error){
	  that.showError('bind',error);
	}
      });
    },
    blurPass: function(e){
      var that = this;
      this.tmpmodel.set({pass:$("#pass").val()},{
	error:function(model, error){
	  that.showError('bind',error);
	}
      });
    },
    bindOk:function(e){
      e.preventDefault();
      var that = this;
      var id = $('.tab')[0].id;
      if(id == "user_have"){
	this.tmpmodel.save({}, {
	  url: App.ClipApp.encodeURI(P+"/login"),
	  type: "POST",
  	  success: function(model, res){
  	    that.trigger("@success", res);
  	  },
  	  error:function(model, res){
	    that.showError('bind',res);
  	  }
	});
      }else if(id == "user_not"){
	this.tmpmodel.save({},{
	  url : App.ClipApp.encodeURI(P+"/register"),
	  type: "POST",
	  success:function(model, res){
	    that.trigger("@success", res);
	  },
	  error:function(model,error){
	    that.showError('bind',error);
	  }
	});
      }
    },
    toggleClass : function(e){
      if(e.currentTarget.id == "user_have"){
	$("#user_not").removeClass("tab");
	$("#bind_ok").val(_i18n('bind.bind_ok'));
      }else if(e.currentTarget.id == "user_not"){
	$("#user_have").removeClass("tab");
	$("#bind_ok").val(_i18n('bind.register_ok'));
      }
      $(e.currentTarget).addClass("tab");
    },
    cancel : function(e){
      e.preventDefault();
      this.trigger("@cancel");
    }
  });

  var bindOauth ,fun, remember = false;//fun 用于记录用户登录前应该触发的事件

  UserBind.show = function(oauth, fun, remember){
    bindOauth = oauth;
    fun = fun;
    remember = remember;
    var model = new App.Model.UserBindModel({info:oauth, provider:oauth.provider});
    var view = new UserBindView({model : model});
    App.popRegion.show(view);
  };

  UserBind.close = function(){
    App.popRegion.close();
    bindOauth = null;
    fun = null;
  };

  function saveOauth(oauth,callback){
    if(oauth){
      var account = oauth.uid+"@"+oauth.provider;
      oauth.account = account;
      var model = new App.Model.UserBindModel(oauth);
      model.save({},{
	type: "POST",
	success:function(model,res){
	  callback(null,res);
	},
	error:function(model,error){
	  //that.showError(error);
	  callback(error,null);
	}
      });
    }
  };

  var success = function(res){
    if(remember){ //关联现在还没有传递“保持登录”,fun 等参数
      var data = new Date();
      data.setTime(data.getTime() + 12*30*24*60*60*1000);
      document.cookie = "token="+res.token+";expires=" + data.toGMTString();
    }else{
      document.cookie = "token="+res.token;
    }
    saveOauth(bindOauth,function(err,reply){
      if(bindOauth.provider == "weibo"){
	App.ClipApp.showConfirm("weibo_sucmsg",bindOauth.name);
      }else if(bindOauth.provider == "twitter"){
	App.ClipApp.showConfirm("twitter_sucmsg",bindOauth.name);
      }
      // App.vent.trigger("app.clipapp.userbind:bindok"); 动作为 Me.me.fetch;
      if(reply){
	if(typeof fun == "function"){ fun(); }
	App.vent.trigger("app.clipapp.login:gotToken",res);
	UserBind.close();
      }
    });
  };

  var cancel = function(){
    if(Backbone.history) Backbone.history.navigate("",true);
    UserBind.close();
  };

 // App.bind("initialize:after", function(){ UserBind.show({info:"ll",provider:"dd"}); });

 return UserBind;
})(App, Backbone, jQuery);