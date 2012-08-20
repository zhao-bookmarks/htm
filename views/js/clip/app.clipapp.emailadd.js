App.ClipApp.EmailAdd = (function(App, Backbone, $){
  var EmailAdd = {};
  var P = App.ClipApp.Url.base;
  var email_pattern = App.util.email_pattern;

  var EmailAddModel = App.Model.extend({
    defaults:{
      email:""
    },
    validate:function(attrs){
      if(!attrs.email || attrs.email == undefined){
	return {email:"is_null"};
      }else if(!email_pattern.test(attrs.email)){
	return {email:"invalidate"};
      }else{
	return null;
      }
    },
    url:function(){
      var my = App.util.getMyUid();
      return P+"/user/"+my+"/email";
    }
  });

  var EmailAddView = App.ItemView.extend({
    tagName: "div",
    className: "emailadd-view",
    template: "#emailAdd-view-template",
    events: {
      "click #emailadd_commit":"EmailAddcommit",
      "click #emailadd_cancel":"EmailAddclose",
      "click .masker_layer"   :"EmailAddclose",
      "click .close_w"        :"EmailAddclose",
      "focus #email"          :"cleanError",
      "error" : "showError"
    },
    initialize: function(){
      this.bind("closeView", close);
    },
    EmailAddclose: function(){
      var data = this.getInput();
      this.trigger("closeView",data.email);
    },
    EmailAddcommit: function(){
      var view = this;
      var data = view.getInput();
      if(data.email){ data.email = data.email.toLowerCase(); }
      this.model.save(data,{
	type:"POST",
	success: function(model, res){
	  App.vent.trigger("app.clipapp.message:confirm", "addemail", model.get("email"));
	  view.trigger("closeView");
	},
	error:function(model, res){
	  if(res.email == "no_uname"){
	    App.vent.trigger("app.clipapp.message:confirm", res);
	  }else{
	    view.showError('emailAdd',res);
	  }
	}
      });
    }
  });

  // 操作完成直接关闭 view
  var close = function(address){
    EmailAdd.close(address);
  };

  EmailAdd.show = function(uid){
    var emailAddModel = new EmailAddModel();
    var emailAddView = new EmailAddView({model : emailAddModel});
    App.popRegion.show(emailAddView);
  };

  EmailAdd.active = function(key){
    var model = new App.Model();
    model.save({},{
      url: App.ClipApp.Url.base+"/active/"+key,
      type: "POST",
      success:function(model,response){ // 不只是弹出提示框这么简单
	App.vent.trigger("app.clipapp.message:confirm", {active:"email"}, response.email);
      },
      error:function(model,error){ // 则显示该链接不能再点击
	App.vent.trigger("app.clipapp.message:confirm", error);
      }
    });
  };

  EmailAdd.close = function(address){
    if(!address)
      App.popRegion.close();
    else{
      App.vent.trigger("app.clipapp.message:alert", "emailadd_save");
      App.vent.bind("app.clipapp.message:sure",function(){
	App.popRegion.close();
      });
    }
  };

  return EmailAdd;
})(App, Backbone, jQuery);