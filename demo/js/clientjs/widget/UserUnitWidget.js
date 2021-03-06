﻿UserUnitWidget = function(_container,options){
  this.container = _container;
  this.options = options;
  this.widgetType = "UsetUnitWidget";
  var uuWidget = this;
  var _view = Backbone.View.extend({
    el:$(_container),
    initialize:function(){
      this.render();
    },
    render:function(){
      var template = _.template($("#userUnit_template").html(),{name:client.GLOBAL_CACHE["userInfo"].name});
      this.el.html(template);
    },
    events:{
      "mouseover":"showOptions",
      "mouseout":"hideOptions",
      "click #updatePwd_button":"updatePwd",
      "click #emailRule_button":"emailRule",
      "click #listEmail_button":"listEmail",
      "click #logout_button":"logoutAction"
    },
    showOptions:function(){
      $("#userOption").css("display","");
    },
    hideOptions:function(){
      $("#userOption").css("display","none");
    },
    updatePwd:function(){
      if(!uuWidget.parentApp.updatePwdWidget)
	updatePwdWidget = new UpdatePwdWidget("#contactArea");
	uuWidget.parentApp.updatePwdWidget = updatePwdWidget;
	uuWidget.addChild(updatePwdWidget);
	uuWidget.parentApp.popUp({width:500,height:200},updatePwdWidget);
    },
    emailRule:function(){
      if(!uuWidget.parentApp.userEmailRuleWidget){
	userEmailRuleWidget = new UserEmailRuleWidget();
	uuWidget.parentApp.userEmailRuleWidget = userEmailRuleWidget;
      }
      uuWidget.parentApp.userEmailRuleWidget.loadEmailRule();
    },
    listEmail:function(){
      //首先判断是否已经在调用loadEmailList了
      if(!uuWidget.parentApp.userEmailWidget){
	userEmailWidget = new UserEmailWidget();
	uuWidget.parentApp.userEmailWidget = userEmailWidget;
      }
      uuWidget.parentApp.userEmailWidget.loadEmailList();
    },
    logoutAction:function(){
      client.GLOBAL_CACHE["userInfo"] = null;
      client.GLOBAL_CACHE["token"] = null;
      document.cookie = "";
      GlobalEvent.trigger(client.EVENTS.USER_LOGOUT);
      this.remove();
    }
  });
  this.view = new _view();
};
UserUnitWidget.prototype.initialize = function(){
  if(!this.view)
    return;
  this.view.initialize();
}
UserUnitWidget.prototype.terminalize = function(){
  this.view.el.empty();
  this.parentApp.removeChild(this);
  this.parentApp.userUnitWidget = null;
}
UserUnitWidget.prototype.render = function(){
  if(!this.view)
    return;
  this.view.render();
}
UserUnitWidget.prototype.addChild = function(childElement){
  if(!this.parentApp)
    return;
  this.parentApp.addChild(childElement);
}
UserUnitWidget.prototype.removeChild = function(childElement){
  this.parentApp.view.updatePwdWidget = null;
  this.parentApp.removeChild(childElement);
}