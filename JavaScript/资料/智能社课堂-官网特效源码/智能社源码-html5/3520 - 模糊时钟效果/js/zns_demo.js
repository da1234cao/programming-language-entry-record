window.onload=function ()
{
	var aSpan=document.getElementsByTagName('span');
	var aNum=[];
	var old='';
	var i=0;
	var updateAll=false;
	
	var sClass='active1';
	
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
			/*for(i=0;i<aSpan.length;i++)
			{
				swap(aSpan[i], aSpan[i].innerHTML);
				clearInterval(timer);
				timer=setInterval(inner, 1000);
			}*/
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
		oSpan.className=sClass;
		zns.site.fx.addEnd(oSpan, function (){
			oSpan.innerHTML=str;
			oSpan.className='';
		});
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
			sClass='active'+(this.index+1);
			
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