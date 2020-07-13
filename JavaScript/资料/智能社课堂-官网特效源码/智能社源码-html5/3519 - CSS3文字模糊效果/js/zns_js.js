window.onload=function ()
{
	var aLi=document.getElementsByTagName('li');
	var timer=null;
	var i=0;
	
	for(i=0;i<aLi.length;i++)
	{
		aLi[i].onmouseover=function ()
		{
			clearTimeout(timer);
			for(i=0;i<aLi.length;i++)
			{
				aLi[i].className='back';
			}
			this.className='active';
		};
		
		aLi[i].onmouseout=function ()
		{
			clearTimeout(timer);
			timer=setTimeout(function (){
				for(i=0;i<aLi.length;i++)
				{
					aLi[i].className='';
				}
			}, 200);
		};
	}
	(function (){
		var oS=document.createElement('script');
			
		oS.type='text/javascript';
		oS.src='http://www.zhinengshe.com/zpi/zns_demo.php?id=3519';
			
		document.body.appendChild(oS);
	})();
};