App.ClipApp.FindPass=(function(App,Backbone,$){
  var FindPass = {};

  var FindPassModel = App.Model.extend({
    url: function(){
      return App.ClipApp.Url.base+"/password/find";
    },
    validate:function(attrs){
      var error = {};
      if(!attrs.address){
	error["address"] = "is_null";
      }
      if(_.isEmpty(error)) return null;
      else return error;
    }
  });
  var FindPassView=App.ItemView.extend({
    tagName:"div",
    className:"findpass-view",
    template:"#findpass-view-template",
    events:{
      "focus #address"  :"clearmsg",
      "keydown #address": "keydownAction",
      "click #submit"   :  "submit",
      "click #cancel"   :  "cancel",
      "click .close_w"  :  "cancel"
    },
    clearmsg:function(e){
      this.cleanError(e);
    },
    keydownAction : function(e){
      $('#address').unbind("keydown");
      if(e.keyCode==13){
	$("#address").blur();
	$('#submit').click();
      }
    },
    submit:function(e){
      e.preventDefault();
      that = this;
      var address = this.$("#address").val();
      this.model.save({address:address},{
	type:"POST",
	success:function(model,res){
	  App.vent.trigger("app.clipapp.findpass:success",res.address);
	},
	error:function(model, res){
	  that.showError('findpass',res);
	}
      });
    },
    cancel:function(e){
      e.preventDefault();
      App.vent.trigger("app.clipapp.findpass:cancel");
    }
  });
  FindPass.show=function(){
    var findPassModel=new FindPassModel();
    var findPassView=new FindPassView({model:findPassModel});
    App.popRegion.show(findPassView);
  };
  FindPass.close=function(){
    App.popRegion.close();
  };
    //link仅供测试使用
  App.vent.bind("app.clipapp.findpass:success",function(address){
    Backbone.history.navigate("",true);
    App.vent.trigger("app.clipapp.message:success", "go_resetpass",address);
    FindPass.close();
  });

  App.vent.bind("app.clipapp.findpass:cancel",function(){
    FindPass.close();
    Backbone.history.navigate("",true);
  });
 //App.bind("initialize:after", function(){ FindPass.show(); });
  return FindPass;
})(App,Backbone,jQuery);