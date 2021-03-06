UserEmailWidget = function(_container,options){
  this.container = _container;
  this.options = options;
  this.widgetType = "UserEmailWidget";
  var _view = Backbone.View.extend({
    el:$(_container),
    initialize:function(){},
    render:function(emails){
      var collection={};
      if(emails){
	collection = emails;
      }
      var template = _.template($("#Listemail_template").html(),{emails:collection});
      this.el.append(template);
    },
    events:{},
    iniEmailList:function(){
      var view = this;
      RequestUtil.getFunc({
	url:client.URL.HOST_URL + client.SYMBOL.SLASH + client.URL.BASE_URL + "my/list",
	successCallBack:function(response){
	  if(response[0] == 0){
	    view.show(response[1]);
	  }else{
	    console.info("iniEmailList fail");
	  }
	},
	errorCallBack:function(response){
	  console.info(response);
	}
      });
    },
    show:function(list){
      var view = this;
      $("#contentWrapper").animate({"width":0,"opacity":0},"slow","swing",function(){
      view.render(list);
      $(this).css("display","none");
      view.el.children(".email-listCont").animate({"width":view.el.width(),"opacity":1},"slow","swing",function(){
	var emailcontainer = $(this).children("email-Cont");
	var emailText = $(this).children(".emailText");
	emailcontainer.append(emailText);

	$("#back").bind("click",function(evt){
	  view.close();
	});
	$("#addEmail").bind("click",function(evt){
	  $("#addEmailDiv").css("display","");
	  if($("#addEmailDiv")){
	    var actionUrl = client.URL.HOST_URL + client.SYMBOL.SLASH + client.URL.BASE_URL + "my/email";
	    var addTemplate = _.template($("#addEmail_template").html(),{actUrl:actionUrl});
	    $("#addEmailDiv").html(addTemplate);
	  }

	  $("#affirm").bind("click",function(evt){
	    var _data = {};
	    _data.email = $("#newEmail").val();
	    RequestUtil.postFunc({
	      url:client.URL.HOST_URL + client.SYMBOL.SLASH + client.URL.BASE_URL +"my/email",
	      data:_data,
	      successCallBack:function(response){
		if(response[0] == 0){
		  var id = response[1];
		$("#addEmailDiv").html("<a href=#/active/"+response[1]+">点击此链接进行激活"+response[1]+"</a>");
		  location.href = "#/my/list";
		}else{
		  // alert(response[0]);
		}
	      },
	    erroeCallBack:function(response){}
	  });
	});

	$("#cancel").bind("click",function(evt){
	  $("#addEmailDiv").css("display","none");
	});

     });

     });
    });
  },
  close:function(){
    var view = this;
    this.el.children(".email-listCont").animate({"width":0,"opacity":0},"slow","swing",function(){
     $(this).css("display","none");
     view.el.children(".email-listCont").remove();
     $("#contentWrapper").css("display","");
     $(document).scrollTop(view.tempScrollTop);
     $("#contentWrapper").animate({"opacity":1,"width":view.el.width()},"slow","swing",function(){});
    });
  }
  });
  this.view = new _view();
}
UserEmailWidget.prototype.initialize = function(){
  if(!this.view)
    return;
  this.view.initialize();
}
UserEmailWidget.prototype.loadEmailList = function(){
    this.view.el=$("#page-home");
    $(".email-listCont").remove();
    $(".addClip-container").remove();
    this.view.iniEmailList();
}

UserEmailWidget.prototype.terminalize = function(){
  this.view.el.empty();
  this.parentApp.removeChild(this);
  this.parentApp.userEmailWidget = null;
}
UserEmailWidget.prototype.render = function(){
  if(!this.view)
    return;
  this.view.render();
}
