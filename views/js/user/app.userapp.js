// app.userapp.js
var P = "/_2_";
App.UserApp = (function(App, Backbone, $){
  var UserApp = {};

  // this.id 为用来装载model的user.id [从cookie中获得]
  var UserModel = App.Model.extend({
    url: function(){
     return P+"/user/"+this.id;
     // return "/test/user-"+this.id+".json";
    }
  });

  var UserFaceView = App.ItemView.extend({
    tagName: "div",
    className: "userface-view",
    template: "#userface-view-template"
  });

  var UserBubbView = App.ItemView.extend({
    tagName: "div",
    className: "userbubb-view",
    template: "#userbubb-view-template"
  });

  var showUser = function(userModel){
    var userFaceView = new UserFaceView({
      model: userModel
    });
    var userBubbView = new UserBubbView({
      model: userModel
    });

    App.faceRegion.show(userFaceView);
    App.bubbRegion.show(userBubbView);
  };

  UserApp.login = function(){
    UserApp.Login.open();
  };

  UserApp.register = function(){
    UserApp.Register.open();
  };

  UserApp.show = function(uid){
    var user = new UserModel({
      id: uid
    });
    user.fetch();
    user.onChange(function(userModel){
      App.vent.trigger("user:show", userModel);
    });
    // user.onChange(showUser);
  };

  App.vent.bind("user:show", function(userModel){
    showUser(userModel);
  });

  App.vent.bind("user:login",function(data){
    login(data);
  });

  return UserApp;
})(App, Backbone, jQuery);