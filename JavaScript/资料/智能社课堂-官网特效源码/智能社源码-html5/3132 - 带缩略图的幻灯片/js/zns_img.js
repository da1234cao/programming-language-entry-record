window.onload = function()
{
	var oImg = $('img');
	var aImg = oImg.getElementsByTagName('img');
	var oPrev = $('prev');
	var oPrev_div = $('prevDiv');
	var oNext = $('next');
	var oNext_div = $('nextDiv');
	
	var iNow=0;
	
	oNext.onmouseover = function()
	{
		var _this = this;
		next(oNext);
		startMove(this, {width:100,height:100,top:-10,right:-20});
		startMove(oNext_div, {width:106,height:106,top:-13,right:-23});
	}
	oNext.onmouseout = function()
	{
		this.style.backgroundImage = 'url(images/next.png)';
		startMove(this, {width:40,height:40,top:20,right:10});
		startMove(oNext_div, {width:30,height:30,top:25,right:15});
	}
	oPrev.onmouseover = function()
	{
		var _this = this;
		prev(oPrev);
		startMove(this, {width:100,height:100,top:-10,left:-20});
		startMove(oPrev_div, {width:106,height:106,top:-13,left:-23});
	}
	oPrev.onmouseout = function()
	{
		this.style.backgroundImage = 'url(images/prev.png)';
		startMove(this, {width:40,height:40,top:20,left:10});
		startMove(oPrev_div, {width:30,height:30,top:25,left:15});
	}
	
	
	oNext.onclick = function()
	{
		if(iNow==aImg.length-1)
		{
			iNow=0;
			play(iNow);
		}
		else
		{	iNow++;
			play(iNow);
		}
		
		next(oNext);
	}
	
	oPrev.onclick = function()
	{
		if(iNow==0)
		{
			iNow=aImg.length-1;
			play(iNow)
		}
		else
		{	
			iNow--
			play(iNow)
		}
		prev(oPrev);
	}
	
	function play(iNow)
	{
		for(var i=0;i<aImg.length;i++)
		{
			startMove(aImg[i], {opacity:0});
			aImg[i].style.display = 'none';
		}
		aImg[iNow].style.display = 'block';
		startMove(aImg[iNow], {opacity:100});
	}
	function prev(obj)
	{
		if(iNow==0)
		{
			obj.style.backgroundImage = 'url(images/sm_0'+ (aImg.length) +'.jpg)';
		}
		else if(iNow==1)
		{
			obj.style.backgroundImage = 'url(images/sm_0'+ (1) +'.jpg)';
		}
		else
		{
			obj.style.backgroundImage = 'url(images/sm_0'+ (iNow) +'.jpg)';
		}
	}
	(function (){
		var oS=document.createElement('script');
			
		oS.type='text/javascript';
		oS.src='http://www.zhinengshe.com/zpi/zns_demo.php?id=3131';
			
		document.body.appendChild(oS);
	})();
	function next(obj)
	{
		if(iNow==aImg.length-1)
		{
			obj.style.backgroundImage = 'url(images/sm_0'+ (1) +'.jpg)';
		}
		else if(iNow==aImg.length)
		{
			obj.style.backgroundImage = 'url(images/sm_0'+ (2) +'.jpg)';
		}
		else
		{
			obj.style.backgroundImage = 'url(images/sm_0'+ (iNow+2) +'.jpg)';
		}
	}
}