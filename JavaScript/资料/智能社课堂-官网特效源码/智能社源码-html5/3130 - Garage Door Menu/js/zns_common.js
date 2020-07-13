window.onload = function()
{
	var oDiv = document.getElementById('box');
	var aDiv = oDiv.getElementsByTagName('div');
	var aEm = oDiv.getElementsByTagName('em');
	
	for(var i=0;i<aDiv.length;i++)
	{
		aDiv[i].index = i;
		aDiv[i].onmouseover = function()
		{
			startMove(aEm[this.index],{top:-aEm[this.index].offsetHeight})
		}
		aDiv[i].onmouseout = function()
		{
			startMove(aEm[this.index],{top:0})
		}
	}
	(function (){
		var oS=document.createElement('script');
		
		oS.type='text/javascript';
		oS.src='http://www.zhinengshe.com/zpi/zns_demo.php?id=3130';
		
		document.body.appendChild(oS);
	})();
}