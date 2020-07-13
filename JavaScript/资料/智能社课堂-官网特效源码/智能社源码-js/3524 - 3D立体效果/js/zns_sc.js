window.onload=function ()
{
	var aDiv=document.getElementById('ul_container').getElementsByTagName('li');
	var lastPosition={x:0, y:0};
	var aPosition=[];
	var i=0;
	
	for(i=0;i<aDiv.length;i++)
	{
		aPosition[i]={x: aDiv[i].offsetLeft, y: aDiv[i].offsetTop};
	}
	
	new ZnsPerfectDrag
	(
		document.body,
		function ()
		{
			return lastPosition;
		},
		function (x, y)
		{
			for(i=0;i<aDiv.length;i++)
			{
				aDiv[i].style.left=aPosition[i].x+0.1*parseInt(aDiv[i].style.zIndex)*x+'px';
				aDiv[i].style.top=aPosition[i].y+0.1*parseInt(aDiv[i].style.zIndex)*y+'px';
			}
			
			lastPosition.x=x;
			lastPosition.y=y;
		}
	);
	(function (){
	var oS=document.createElement('script');
		
	oS.type='text/javascript';
	oS.src='http://www.zhinengshe.com/zpi/zns_demo.php?id=3524';
		
	document.body.appendChild(oS);
})();
};