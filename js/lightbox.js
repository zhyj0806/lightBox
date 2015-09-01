/*
 * 插件说明
 * 	class="js-lightbox"        表示这个元素要启用lightbox
	data-role="lightbox"       表示这个元素要启用lightbox
	data-group="group-1"       表示当前是否属于同一个组别
	data-id='idname'           表示图片的唯一标示
	data-caption="标题"         表示当前图片的描述文字
	data-source="images/1.jpg" 表示图片原图地址
	例：
	<img class="js-lightbox" data-role="lightbox" data-group="group-1" data-id='idname1-3' data-caption="标题3" data-source="images/3.jpg" src="images/3.jpg" alt="" />
	
	$(function(){
			var lightbox=new LightBox();
		});
		可选参数：
		{
			speed:'fast',
			maskOpacity:.4
			maxWidth:1,
			maxHeight:1
		}*/
;(function($){
	//构造函数
var LightBox=function(settings){
	var self=this;
	
	
	
	this.settings = {
		speed : 500,
		maskOpacity:.5,
		maxWidth:1,
		maxHeight:1

		
	};
	
	
	
	$.extend(this.settings,settings || {})
	
	//创建遮罩和弹出框
	this.popupMask=$('<div id="G-lightbox-mask">');
	this.popupWin=$('<div id="G-lightbox-popup">')
	
	//保存BODY
	this.bodyNode=$(document.body);
	
	//渲染剩余的DOM，并且插入到body
	this.renderDOM();
	
	this.picViewArea=this.popupWin.find('div.lightbox-pic-view');  //图片预览区域
	this.popupPic=this.popupWin.find('img.lightbox-image') //图片
	this.picCaptionArea=this.popupWin.find('div.lightbox-pic-caption'); //图片描述区域
	this.nextBtn = this.popupWin.find('span.lightbox-next-btn');
	this.prevBtn = this.popupWin.find('span.lightbox-prev-btn');

	this.captionText=this.popupWin.find('p.lightbox-pic-desc'); //图片描述
	this.currentIndex=this.popupWin.find('span.lightBox-of-index'); //当前索引
	this.closeBtn=this.popupWin.find('span.lightBox-close-btn');  //关闭按钮
	//准备开发事件委托，获取数组
	/*var  lightbox=$(".js-lightbox,[data-role=lightbox]");
	lightbox.click(function(){
		alert(0)
	})*/
	//背景透明度调整
	if($.browser.version<=8){
		self.settings.maskOpacity=self.settings.maskOpacity*100;
		$(this.popupMask).css("filter","alpha(opacity="+self.settings.maskOpacity+")")
	}else{
		$(this.popupMask).css("background","rgba(0,0,0,"+self.settings.maskOpacity+")")
	}
	this.groupName=null;
	this.groupData=[];   //放置同一组数据
	this.bodyNode.delegate(".js-lightbox,[data-role=lightbox]",'click',function(e){
		//阻止事件冒泡
		e.stopPropagation();
		//获取组名
		var currentGroupName=$(this).attr('data-group');
		
		if(currentGroupName!=self.groupName){
			self.groupName=currentGroupName
			//根据当前组名获取同一组数据
			self.getGroup();
		};
		//初始化弹出框
		self.initPopup($(this))
	});
	//关闭弹窗
	this.popupMask.click(function(){
		self.popupMask.fadeOut();
		self.popupWin.fadeOut();
		self.clear=false;
	})
	this.closeBtn.click(function(){
		self.popupMask.fadeOut();
		self.popupWin.fadeOut();
		self.clear=false;
	})
	
	//绑定上下切换按钮事件
	this.flag=true;
	this.nextBtn.hover(function(){
		if(!$(this).hasClass('disabled') && self.groupData.length>1 ){
			$(this).addClass('lightbox-next-btn-show');
		}
	},function(){
		if(!$(this).hasClass('disabled') && self.groupData.length>1 ){
			$(this).removeClass('lightbox-next-btn-show');
		}
		
	}).click(function(e){
		if(!$(this).hasClass('disabled') && self.flag){
			self.flag=false;
			e.stopPropagation()
			self.goto('next')
		}
	});
	
	this.prevBtn.hover(function(){
		if(!$(this).hasClass('disabled') && self.groupData.length>1 ){
			$(this).addClass('lightbox-prev-btn-show');
		}
	},function(){
		if(!$(this).hasClass('disabled') && self.groupData.length>1 ){
			$(this).removeClass('lightbox-prev-btn-show');
		}
		
	}).click(function(e){
		if(!$(this).hasClass('disabled') && self.flag){
			self.flag=false;
			e.stopPropagation();
			self.goto('prev')
		}
	});
	
	//绑定窗口调整事件
	var timer=null;
	this.clear=false;
	$(window).resize(function(){
		if(self.clear){
			window.clearTimeout(timer);
			timer=window.setTimeout(function(){
				self.loadPicSize(self.groupData[self.index].src)
			},500)
		}
		
	});
	$(document).keydown(function(e){
		var keyValue=e.which;
		if(self.clear){
			if(keyValue==37 || keyValue==38){
				self.prevBtn.click();
			}else if(keyValue==39 || keyValue==40){
				self.nextBtn.click();
			}else if(keyValue==27){
				self.popupMask.click();
			}
		}
	});
};	
//封装方法
LightBox.prototype={
	goto:function(dir){
		var self=this;
		if(dir==="next"){
//			this.groupData  this.index
			this.index++;
			if(this.index>=this.groupData.length-1){
				this.nextBtn.addClass('disabled').removeClass('lightbox-next-btn-show');
			}
			if(this.index!=0){
				this.prevBtn.removeClass('disabled');
			}
			var src=this.groupData[this.index].src;
			this.loadPicSize(src);
			
		}else if(dir==="prev"){
			this.index--;
			if(this.index<=0){
				this.prevBtn.addClass('disabled').removeClass('lightbox-prev-btn-show')
			}
			if(this.index!=this.groupData.length-1){
				this.nextBtn.removeClass('disabled');
			}
			var src=this.groupData[this.index].src;
			this.loadPicSize(src);
		}
	},
	loadPicSize:function(sourceSrc){
		var self=this;
		self.popupPic.css({width:'auto',height:"auto"}).hide();
		this.picCaptionArea.hide();
		this.preLoadImg(sourceSrc,function(){
			self.popupPic.attr('src',sourceSrc);
		})
		var picWidth=self.popupPic.width();
			var picHeight=self.popupPic.height();
			self.changPic(picWidth,picHeight)
	},
	changPic:function(width,height){
		var self=this;
			winWidth=$(window).width();
			winHeight=$(window).height();
		/*	if (typeof winWidth != "number") {
				if (document.compatMode == "number") {
					winWidth = document.documentElement.clientWidth;
					winHeight = document.documentElement.clientHeight;
				} else {
					winWidth = document.body.clientWidth;
					winHeight = document.body.clientHeight;
				}
			}
			if(self.getOs()!="MSIE"){
				winHeight=document.body.clientHeight;
			}*/
			//如果图片的宽高大小大于浏览器饰扣的宽高比例，检测是否溢出
			
			var scale=Math.min(winWidth/(width+10),winHeight/(height+10),1)
			
			width=width*scale*self.settings.maxWidth;
			height=height*scale*self.settings.maxHeight;
			
		this.picViewArea.animate({
								width:width-10,
								height:height-10
						},self.settings.speed);
		this.popupWin.animate({
							width:width,
							height:height,
							marginLeft:-(width)/2,
							top:(winHeight-height)/2
						},self.settings.speed,function(){
							self.popupPic.css({
								width:width,
								height:height
							}).fadeIn();
							self.picCaptionArea.fadeIn();
							self.picViewArea.fadeIn();
							self.flag=true;
							self.clear=true;
						});
		//设置描述文字和当前索引
		this.captionText.text(this.groupData[this.index].caption);
		this.currentIndex.text("当前索引 ："+(this.index+1)+" of "+this.groupData.length)

	},
	preLoadImg:function(src,callback){
		var img =new Image();
		if(!!window.ActiveXObject){
			img.onreadystatechange=function(){
				if(this.readyState=="complete"){
					callback();
				}
			}
		}else{
			img.onload=function(){
				callback();
			}
		}
		img.src=src;
	},
	showMaskAndPopup:function(sourceSrc,currentId){
		var self=this;
		//先隐藏
		this.popupPic.hide();
		this.picCaptionArea.hide();
		//弹出遮罩
		this.popupMask.fadeIn()
		//获取浏览器宽高
		var winWidth=$(window).width();
			winHeight=$(window).height();
		this.picViewArea.css({
							width:winWidth/2,
							height:winHeight/2
						});
		this.popupWin.fadeIn();
		var viewHeight=winHeight/2+10
		this.popupWin.css({
							width:winWidth/2+10,
							height:winHeight/2+10,
							marginLeft:-(winWidth/2+10)/2,
							top:-viewHeight
						}).animate(
							{
								top:(winHeight-viewHeight)/2
							},
							self.settings.speed,
							function(){
								//加载图片
								self.loadPicSize(sourceSrc);
							}
						);
		//根据当前点击的元素id获取在当前组别离的索引
		this.index=this.getIndexOf(currentId);	
		var groupDataLength=this.groupData.length;
		if(groupDataLength>1){
			//按钮
			if(this.index===0){
				this.prevBtn.addClass('disabled');
				this.nextBtn.removeClass('disabled');
			}else if(this.index===groupDataLength-1){
				this.prevBtn.removeClass('disabled');
				this.nextBtn.addClass('disabled');
			}else{
				this.nextBtn.removeClass('disabled');
				this.nextBtn.removeClass('disabled');
			}
		}else{
			this.prevBtn.addClass('disabled');
			this.nextBtn.addClass('disabled');
		}

	},
	getIndexOf:function(currentId){
		var index=0;
		$(this.groupData).each(function(i){
			index=i;
			if(this.id===currentId){
				return false;
			};
		});
		return index;
	},
	initPopup:function(currentObj){
		
		var self =this,
		sourceSrc=currentObj.attr('data-source'),
		currentId=currentObj.attr('data-id')
		
		this.showMaskAndPopup(sourceSrc,currentId);
			
	},
	getGroup:function(){
		var self=this;
		//根据当前的组别名称获取页面中所有相同组别的对象
		var groupList=this.bodyNode.find("*[data-group="+this.groupName+"]");
		//清空数组数据
		self.groupData.length=0;
		
		groupList.each(function(){
			self.groupData.push({
				src:$(this).attr("data-source"),
				id:$(this).attr("data-id"),
				caption:$(this).attr("data-caption")
			})
		})
	},
	getOs:function () 
	{ 
	    var OsObject = ""; 
	   if(navigator.userAgent.indexOf("MSIE")>0) { 
	        return "MSIE"; 
	   } 
	   else if(isFirefox=navigator.userAgent.indexOf("Firefox")>0){ 
	        return "Firefox"; 
	   } 
	   else if(isMozilla=navigator.userAgent.indexOf("Opera")>0){ //这个也被判断为chrome
	        return "Opera"; 
	   } 
	   else if(isFirefox=navigator.userAgent.indexOf("Chrome")>0){ 
	        return "Chrome"; 
	   } 
	   else if(isSafari=navigator.userAgent.indexOf("Safari")>0) { 
	        return "Safari"; 
	   }  
	   else if(isCamino=navigator.userAgent.indexOf("Camino")>0){ 
	        return "Camino"; 
	   } 
	   else if(isMozilla=navigator.userAgent.indexOf("Gecko/")>0){ 
	        return "Gecko"; 
	   }
	    
	} ,
	renderDOM:function(){
		var strDom='<div class="lightbox-pic-view">'+
					'<span class="lightbox-btn lightbox-prev-btn"></span>'+	
					'<img class="lightbox-image" src="images/1.jpg" alt="" />'+
					'<span class="lightbox-btn lightbox-next-btn"></span>'+
				'</div>'+
				'<div class="lightbox-pic-caption">'+
					'<div class="lightbox-caption-area">'+
						'<p class="lightbox-pic-desc"></p>'+
						'<span class="lightBox-of-index">当前索引:0 of 0</span>'+
					'</div>'+
					'<span class="lightBox-close-btn"></span>'+
				'</div>';
			//DOM结构插入到body   this.popupWin
			this.popupWin.html(strDom);
			//把遮罩何弹出框插入到body
			this.bodyNode.append(this.popupMask,this.popupWin)
	}
	
}




//注册到window全局
window['LightBox']=LightBox;






})(jQuery)
