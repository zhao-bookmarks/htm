// app.clipapp.login.js

App.ClipApp.UserBind = (function(App, Backbone, $){

  var UserBind = {};

  App.Model.UserBindModel = App.Model.extend({});
  var UserBindView = App.ItemView.extend({
    tagName : "div",
    className : "bind-view",
    template : "#bind-view-template",
    events : {
      "click .close_w"           : "cancel",
      "click #bind_ok"           : "bindOk",
      "click #user_hava"         : "toggleClass",
      "click #user_not"          : "toggleClass",
      "blur #bind_name"               : "blurName",
      "blur #bind_pass"               : "blurPass",
      "focus #bind_name"              : "cleanError",
      "focus #bind_pass"              : "cleanError"
    },
    initialize:function(){
      this.tmpmodel = new App.Model.LoginModel();
    },
    blurName: function(e){
      var that = this;
      this.tmpmodel.set({name:$("#bind_name").val()}, {
	error:function(model, error){
	  that.showError(error);
	}
      });
    },
    blurPass: function(e){
      var that = this;
      this.tmpmodel.set({pass:$("#bind_pass").val()},{
	error:function(model, error){
	  that.showError(error);
	}
      });
    },
    bindOk:function(e){
      e.preventDefault();
      var that = this;
      var str = $(".tab").text().trim();
      console.info(str);
      if(str == "我有点易账号"){
	this.tmpmodel.save({}, {
	  url: App.ClipApp.Url.base+"/login",
	  type: "POST",
  	  success: function(model, res){
  	    App.vent.trigger("app.clipapp.userbind:@success", res);
  	  },
  	  error:function(model, res){
	    that.showError(res);
  	  }
	});
      }else{
	this.tmpmodel.save({},{
	  url : App.ClipApp.Url.base+"/register",
	  type: "POST",
	  success:function(model,res){
	    App.vent.trigger("app.clipapp.userbind:@success",res);
	  },
	  error:function(model,error){
	    that.showError(error);
	  }
	});
      }
    },
    toggleClass : function(e){
      if(e.currentTarget.id == "user_hava"){
	$("#user_not").removeClass("tab");
      }else if(e.currentTarget.id == "user_not"){
	$("#user_hava").removeClass("tab");
      }
      $(e.currentTarget).addClass("tab");
    },
    cancel : function(e){
      e.preventDefault();
      App.vent.trigger("app.clipapp.login:@cancel");
    }
  });

  var bindOauth ;

  UserBind.show = function(){
    var model = new App.Model.UserBindModel();
    var view = new UserBindView({model : model});
    App.popRegion.show(view);
  };

  UserBind.close = function(){
    App.popRegion.close();
    bindOauth = null;
  };

  function saveOauth(uid){
    if(bindOauth){
      var model = new App.Model.UserBindModel(bindOauth);
      model.save({},{
	url : App.ClipApp.Url.base+"/user/"+uid+"/oauth_info",
	type: "POST",
	success:function(model,res){
	  Backbone.history.navigate("my",true);
	  UserBind.close();
	},
	error:function(model,error){
	  //that.showError(error);
	}
      });
    }
  }

  App.vent.bind("app.clipapp.userbind:show",function(oauth){
    UserBind.show();
    bindOauth = oauth;
    //console.info(bindOauth);
  });

  App.vent.bind("app.clipapp.userbind:@success", function(res){
    var data = new Date();
    data.setTime(data.getTime() + 7*24*60*60*1000);
    document.cookie = "token="+res.token+";expires=" + data.toGMTString();
    saveOauth(res.token.split(":")[0]);
  });

  App.vent.bind("app.clipapp.userbind:@error", function(model, error){
    UserBind.show(model, App.util.getErrorMessage(error));
  });

  App.vent.bind("app.clipapp.userbind:@cancel", function(){
    UserBind.close();
  });

 // TEST

// App.bind("initialize:after", function(){ UserBind.show(); });

 return UserBind;
})(App, Backbone, jQuery);