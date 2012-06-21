 // app.clipapp.cliplist.js
App.ClipApp.ClipList = (function(App, Backbone, $){

  var ClipList = {};
  var flag = false;
  var clips_exist = true;
  var hide_clips = [];
  var clipListView = {};
  var collection = {},start = 1,end = App.ClipApp.Url.page;
  var url = "",base_url = "",data = "",type = "",collection_length,new_page;
  var ClipPreviewModel = App.Model.extend({
    defaults:{
      recommend:"",//列表推荐的clip时有此属性
      user :{},
      content:{},
      reprint_count:"",
      reply_count:"",
      hide:false
    }
  });

  // 对my interest 和 my recommened的数据进行转换
  // [同时避免不同用户之间的clipid相同的冲突]
  // 不同用户转载给我相同的数据
  var ClipPreviewList = App.Collection.extend({
    model : ClipPreviewModel,
    parse : function(resp){
      for( var i=0; resp && i<resp.length; i++){
	// 使得resp中的每一项内容都是对象
	if(!resp[i].clip){ // 表示是别人推荐的clip
	  resp[i].clipid = resp[i].id;
	  resp[i].id = resp[i].user.id+":"+resp[i].id;
	}else{
	  resp[i].clipid = resp[i].clip.id;
	  resp[i].user = resp[i].clip.user;
	  resp[i].content = resp[i].clip.content;
	  resp[i].reprint_count = resp[i].clip.reprint_count? resp[i].clip.reprint_count:0;
	  resp[i].reply_count = resp[i].clip.reply_count? resp[i].clip.reply_count:0;
	  delete resp[i].clip;
	  resp[i].id = resp[i].recommend.user.id+":"+resp[i].recommend.rid;
	}
	if(resp[i].hide){
	  hide_clips.push(resp[i].id);
	}
      }
      return resp;
    }
  });

  var ClipPreviewView = App.ItemView.extend({
    tagName: "article",
    className: "clip",
    template: "#clippreview-view-template",
    events: {
      // 单击clip就响应show_detail事件
      "click #header" : "show_detail",
      "click .operate" : "operate",
      "mouseenter .clip_item": "mouseEnter",
      "mouseleave .clip_item": "mouseLeave"
    },
    initialize: function(){
      var that = this;
      var $container = $('#list');
      $container.imagesLoaded( function(){
	$container.masonry({
	  itemSelector : '.clip'
	});
      });
      this.bind("item:rendered",function(itemView){
	if(this.model.get("content").image){
	  this.$el.find("p").addClass("text");
	}else{
          this.$el.find("p").addClass("no_img_text");
	  this.$el.find("span.biezhen").remove();
	}
	var $newElems = itemView.$el;
	flag = true;
	$newElems.imagesLoaded(function(){
	  //STRANGE若不加延时则所有clip无图片时不产生动态布局效果,无图此段代码也会运行
	  setTimeout(function(){
	    $("#list").masonry("reload");
	  },0);
	});
      });
    },
    show_detail: function(){
      //var clip = this.model.get("clip");
      //var clipid = clip.user.id+":"+clip.id;
      var rid = this.model.get("recommend").rid;
      var clipid = this.model.get("user").id + ":" + this.model.get("clipid");
      App.vent.trigger("app.clipapp:clipdetail",clipid,this.model.id,rid);
    },
    mouseEnter: function(e){
      $(e.currentTarget).children(".master").children("#opt").show();
    },
    mouseLeave: function(e){
      $(e.currentTarget).children(".master").children("#opt").hide();
    },
    operate: function(e){
      e.preventDefault();
      var opt = $(e.currentTarget).attr("class").split(' ')[0];
      var cid = this.model.get("user").id + ":" + this.model.get("clipid");
      var rid = this.model.get("recommend").rid;
      //var clip = this.model.get("clip");
      //var cid = clip.user.id+":"+clip.id;
      switch(opt){
	case 'biezhen'://收
	App.vent.trigger("app.clipapp:reclip", cid,this.model.id, rid);break;
	case 'refresh'://转
	  App.vent.trigger("app.clipapp:recommend", cid,this.model.id);break;
	case 'comment'://评
	  App.vent.trigger("app.clipapp:comment", cid,this.model.id);break;
	case 'note'://注
	  App.vent.trigger("app.clipapp:clipmemo", cid);break;
	case 'change'://改
	  App.vent.trigger("app.clipapp:clipedit", cid);break;
	case 'del'://删
	  App.vent.trigger("app.clipapp:clipdelete", cid);break;
      }
    }
  });

  var ClipListView = App.CollectionView.extend({
    tagName: "div",
    className: "preview-view",
    itemView: ClipPreviewView,
    initialize: function(){
      /*
      this.bind("collection:rendered",function(itemView){
      	var $container = $('#list');
	$container.imagesLoaded( function(){
	  $container.masonry({
	    itemSelector : '.clip'
	  });
	});
	setTimeout(function(){ // STRANGE BEHAVIOUR
	  //$("#list").masonry("appended", itemView.$el);
	  //$('#list').prepend( itemView.$el ).masonry( 'reload' );
	  //$("#list").masonry("reload");
	},0);
      });
      */
    }
  });

  ClipList.flag_show_user = true;//clippreview是否显示用户名和用户头像
  // site == user2 网站首首页
  ClipList.showSiteClips = function(tag){
    ClipList.flag_show_user = true;
    base_url = App.ClipApp.Url.base+"/query";
    // 起始时间设置为，endTime前推一个月
    var date = (new Date()).getTime();
    data = {"public":true, "startTime":date-86400000*30,"endTime":date+10000};
    if(tag) data.tag = [tag];
    type = "POST";
    init_page();
  };

  ClipList.showUserClips = function(uid, tag){
    ClipList.flag_show_user = false;
    base_url = App.ClipApp.Url.base+"/user/"+uid+"/query";
    data = {user: uid,"startTime":Date.parse('May 1, 2012'),"endTime":(new Date()).getTime()+10000};
    if(tag) data.tag = [tag];
    type = "POST";
    init_page();
  };

  // 这两个Query对结果是没有要求的，按照关键字相关度
  ClipList.showSiteQuery = function(word, tag){
    ClipList.flag_show_user = true;
    base_url = App.ClipApp.Url.base + "/query";
    var date = (new Date()).getTime();
    data = {text: word, "startTime":date-86400000*30,"endTime":(new Date()).getTime()+10000};
    if(tag) data.tag = [tag];
    type = "POST";
    init_page();
  };

  ClipList.showUserQuery = function(uid, word, tag){
    ClipList.flag_show_user = false;
    base_url = App.ClipApp.Url.base + "/user/"+uid+"/query";
    data = {text: word, user: uid, "startTime":Date.parse('May 1, 2012'),"endTime":(new Date()).getTime()+10000};
    if(tag) data.tag = [tag];
    type = "POST";
    init_page();
  };

  ClipList.showUserInterest = function(uid, tag){
    ClipList.flag_show_user = true;
    base_url = "/user/" + uid + "/interest";
    if(tag) base_url += "/tag/" + encodeURIComponent(tag);
    base_url = App.ClipApp.Url.base + base_url;
    data = null;
    type = "GET";
    init_page();
  };

  ClipList.showUserRecommend = function(uid, tag){
    ClipList.flag_show_user = true;
    base_url = "/user/"+uid+"/recomm";
    if(tag) base_url += "/tag/"+encodeURIComponent(tag);
    base_url = App.ClipApp.Url.base + base_url;
    data = null;
    type = "GET";
    init_page();
  };
  function collection_filter(collection,hide_list){
    collection_length -= hide_list.length;
    for(var i=0;i<hide_list.length;i++){
      collection.remove(collection.get(hide_list[i]));
    }
  };
  function init_page(){
    var clips = new ClipPreviewList();
    collection = clips;
    start = 1;
    end = App.ClipApp.Url.page;
    url = App.util.unique_url(base_url + "/" + start+".."+ end);
    if(data){
      data = JSON.stringify(data);
      var contentType = "application/json; charset=utf-8";
      collection.fetch({url:url,type:type,contentType:contentType,data:data});
    }else{
      collection.fetch({url:url,type:type});
    }
    collection.onReset(function(clips){
      if(clips&&clips.length==0){
	clips_exist = false;
      }
      collection_length = clips.length;
      new_page = collection.length==App.ClipApp.Url.page ? true :false;
      collection_filter(clips,hide_clips);
      clipListView = new ClipListView({collection:clips});
      $('#list').masonry({
	itemSelector : '.clip',
	columnWidth : 330,
	isAnimated: false,//动态效果导致：overflow:hidden  cliplist 边被裁掉
	animationOptions: {
	  duration: 800,
	  easing: 'linear',
	  queue: false
	}
      });
      $("#list").css({height:"0px"});
      App.listRegion.show(clipListView);
      //App.vent.trigger("app.clipapp:showpage");
      if(collection.length<10){
	App.vent.trigger("app.clipapp:nextpage");
      }
      if(!clips_exist){
	$("#list").append("抱歉，没有找到相应的信息...");
      }else{
      }
    });
  };

  App.vent.bind("app.clipapp:nextpage",function(){
    if(!App.listRegion.currentView)return;
    if(App.listRegion.currentView.$el[0].className=="preview-view"&&new_page){
      start += App.ClipApp.Url.page;
      end += App.ClipApp.Url.page;
      url = App.util.unique_url(base_url + "/" + start + ".." + end);
      var contentType = "application/json; charset=utf-8";
      if(!data){
	contentType = null;
      }
      collection.fetch({
	url:url,
	type:type,
	contentType:contentType,
	add:true,
	data:data,
	error :function(){ new_page = false; },
	success :function(){
	  if(collection.length-collection_length>=App.ClipApp.Url.page){
	    collection_length = collection.length;
	  }else{
	    new_page = false;
	  }
	}
      });
    }
  });

  App.vent.bind("app.clipapp.cliplist:add",function(addmodel){
    var uid = App.util.getMyUid();
    var id = uid+":"+addmodel.id;
    var model = new ClipPreviewModel();
    var clip = {};
    var clipid = addmodel.id;
    var tag = addmodel.get("tag");
    var note = addmodel.get("note");
    var _public = addmodel.get("public");
    var user = {id : uid};
    var content = App.util.getPreview(addmodel.get("content"), 100);
    //clip本身的id为自己的id，model的id为uid:cid
    model.set({"public":_public,"content":content,"id":id,"clipid":clipid,"tag":tag,"note":note,"user":user,"recommend":""});
    var fn = clipListView.appendHtml;
    clipListView.appendHtml = function(collectionView, itemView){
      collectionView.$el.prepend(itemView.el);
      clipListView.appendHtml = fn;
    };
    clipListView.collection.add(model,{at:0});
    start++;
    collection_length++;
    $("#list").masonry("reload");
  });

  App.vent.bind("app.clipapp.cliplist:remove",function(model_id){
    var model = clipListView.collection.get(model_id);
    clipListView.collection.remove(model);
    $("#list").masonry("reload");
    start--;
    collection_length--;
    if(collection_length == 0){
      App.vent.trigger("app.clipapp:nextpage");
    }
  });

  // 评论总数以及转载总数的同步
  App.vent.bind("app.clipapp.cliplist:refresh",function(args){
    var model=App.listRegion.currentView.collection.get(args.model_id);
    var clip=model.get("clip");
    if(args.type == "comment"){
      if(args.pid == 0){
	var reply_count = model.get("reply_count") ? model.get("reply_count")+1 : 1;
	model.set({"reply_count":reply_count});
      }
    }
    if(args.type == "reclip"){
      var reprint_count = model.get("reprint_count") ? model.get("reprint_count")+1 : 1;
      model.set({"reprint_count":reprint_count});
    }
  });

  App.vent.bind("app.clipapp.cliplist:edit", function(content,model_id){
    var collection = clipListView.collection;
    var model = collection.get(model_id);
    var newcontent = App.util.getPreview(content, 100);
    model.set({content:newcontent});
  });

  return ClipList;

})(App, Backbone, jQuery);