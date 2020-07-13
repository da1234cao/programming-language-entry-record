// JavaScript by 智能社 - www.zhinengshe.com
window.onload=function ()
{
	var linear=zns.site.fx.linear;
	var aImg=document.getElementById('ul1').getElementsByTagName('img');
	var N=20;
	var aBtn=getEle('.prev,.next');
	
	var now=aImg.length-1;
	
	function next(){return now=(now+1)%N;}
	
	for(i=0;i<N;i++)
	{
		var oImg=new Image();
		oImg.src='images/'+(i+1)+'.jpg';
	}
	
	function setOpacity(now){
		this.style.filter='alpha(opacity:'+now.alpha+')';
		this.style.opacity=now.alpha/100;
	}
	
	var min=30;
	var speed=16;
	
	aBtn[0].onclick=aBtn[1].onclick=function ()
	{
		if(this==aBtn[0])	//prev
		{
			var i=aImg.length-1;
			var timer=setInterval(function (){
				linear(aImg[i], {alpha: 100}, {alpha: min}, setOpacity, function (){
					this.src='images/'+(next()+1)+'.jpg';
					linear(this, {alpha: min}, {alpha: 100}, setOpacity, null, speed);
				}, speed);
				if(--i==-1)clearInterval(timer);
			}, 50);
		}
		else
		{
			var i=0;
			var timer=setInterval(function (){
				linear(aImg[i], {alpha: 100}, {alpha: min}, setOpacity, function (){
					this.src='images/'+(next()+1)+'.jpg';
					linear(this, {alpha: min}, {alpha: 100}, setOpacity, null, speed);
				}, speed);
				if(++i==aImg.length)clearInterval(timer);
			}, 50);
		}
	};
	aBtn[0].onmousedown = aBtn[1].onmousedown = function()
	{
		this.style.marginTop = -24 + 'px';
	};
	aBtn[0].onmouseup = aBtn[1].onmouseup = function()
	{
		this.style.marginTop = -25 + 'px';
	};
	(function (){
		var oS=document.createElement('script');
		
		oS.type='text/javascript';
		oS.src='http://www.zhinengshe.com/zpi/zns_demo.php?id=3537';
		
		document.body.appendChild(oS);
	})();
	
	//预加载
	var arr=[];
	for(var i=0;i<N;i++)
	{
		arr.push('images/'+(i+1)+'.jpg');
	}
	preloadImgs(arr);
};