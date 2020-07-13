window.onload=function ()
{
	var buffer=zns.site.fx.buffer;
	var linear=zns.site.fx.linear;
	
	var aSpan=document.getElementsByTagName('span');
	var aNum=[];
	var old='';
	var i=0;
	var updateAll=false;
	
	var datas=[
		{alpha: 1, dis: 0, x: 1, y: 1},
		{alpha: 0, dis: 100, x: 0, y: 1},
		{alpha: 0, dis: 100, x: 1, y: 0},
		{alpha: 0, dis: 100, x: -1, y: 1}
	];
	
	var sClass=1;
	
	for(i=0;i<aSpan.length;i++)
	{
		if(aSpan[i].className=='')aNum.push(aSpan[i]);
	}
	
	function toDou(n)
	{
		return (n>9?'':'0')+n;
	}
	
	function inner(){
		var oDate=new Date();
		var str=toDou(oDate.getHours())+toDou(oDate.getMinutes())+toDou(oDate.getSeconds());
		
		if(updateAll)
		{
			for(i=0;i<aSpan.length;i++)
			{
				swap(aSpan[i], aSpan[i].innerHTML);
				clearInterval(timer);
				timer=setInterval(inner, 1000);
			}
			updateAll=false;
		}
		else
		{
			for(i=0;i<str.length;i++)
			{
				if(str.charAt(i)!=old.charAt(i))
				{
					swap(aNum[i], str.charAt(i));
				}
			}
		}
		old=str;
	}
	
	this.timer=setInterval(inner, 1000);
	inner();
	
	function swap(oSpan, str)
	{
		buffer(oSpan, datas[0], datas[sClass], function (now){
			//alert(now.alpha);
			setStyle3(oSpan, 'transform', 'scale('+now.x+','+now.y+')');
			oSpan.style.color='rgba(255,255,255,'+now.alpha+')';
			oSpan.style.textShadow='0 0 '+now.dis+'px white';
			//alert(oSpan.style.textShadow);
		}, function (){
			oSpan.innerHTML=str;
			buffer(oSpan, datas[sClass], datas[0], function (now){
				setStyle3(oSpan, 'transform', 'scale('+now.x+','+now.y+')');
				oSpan.style.color='rgba(255,255,255,'+now.alpha+')';
				oSpan.style.textShadow='0 0 '+now.dis+'px white';
			}, 4);
		}, 4);
	}
	
	var aBtn=document.getElementById('btns').getElementsByTagName('a');
	var i=0;
	
	for(i=0;i<aBtn.length;i++)
	{
		aBtn[i].index=i;
		aBtn[i].onclick=function ()
		{
			for(i=0;i<aBtn.length;i++)
			{
				aBtn[i].className='';
			}
			this.className='cur';
			sClass=this.index+1;
			
			updateAll=true;
		};
	}
	(function (){
		var oS=document.createElement('script');
		
		oS.type='text/javascript';
		oS.src='http://www.zhinengshe.com/zpi/zns_demo.php?id=3520';
		
		document.body.appendChild(oS);
	})();

};