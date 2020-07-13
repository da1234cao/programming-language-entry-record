window.onload = function()
{
	var oDiv = $('box');
	var oImg = getByClass(oDiv,'img')[0];
	var oPhoto = oImg.getElementsByTagName('img')[0];
	var oH2 = oImg.getElementsByTagName('h2')[0];
	var oH3 = oImg.getElementsByTagName('h3')[0];
	var oUl = getByClass(oDiv,'imgNav')[0];
	var aLi = oUl.getElementsByTagName('li');
	var aDiv = oUl.getElementsByTagName('div');
	var aDiv_p = oUl.getElementsByTagName('p');
	
	for(var i=0;i<aLi.length;i++)
	{
		aLi[i].index = i;
		aDiv[i].style.background = 'url(img/navImg_0'+(i+1)+'.jpg) left top no-repeat';
		aDiv_p[i].style.background = '-webkit-linear-gradient(rgba(255,255,255,0.3) 40%, rgba(255,255,255,0.4)),url(img/navImg_0'+ (i+1) +'.jpg) left top no-repeat';
		aDiv_p[i].style.background = '-moz-linear-gradient(rgba(255,255,255,0.3) 40%, rgba(255,255,255,0.4)),url(img/navImg_0'+ (i+1) +'.jpg) left top no-repeat';
		aDiv_p[i].style.background = '-ms-linear-gradient(rgba(255,255,255,0.3) 40%, rgba(255,255,255,0.4)),url(img/navImg_0'+ (i+1) +'.jpg) left top no-repeat';
		aDiv_p[i].style.background = '-o-linear-gradient(rgba(255,255,255,0.3) 40%, rgba(255,255,255,0.4)),url(img/navImg_0'+ (i+1) +'.jpg) left top no-repeat';

		aLi[i].onmouseover = function()
		{
			for(var i=0;i<aLi.length;i++)
			{
				startMove(aDiv[i], {top:-240,opacity:0},15)
			}
			startMove(aDiv[this.index], {top:0,opacity:100},15)
		}
		aLi[i].onmouseout = function()
		{
			for(var i=0;i<aLi.length;i++)
			{
				startMove(aDiv[i], {top:-240,opacity:0},15)
			}
		}
		aLi[i].onclick = function()
		{
			startMove(oH2, {opacity:0},10);
			startMove(oH3, {opacity:0},10);
			
			oPhoto.src = 'img/0'+ (this.index+1) +'.jpg';
			oPhoto.style.marginLeft = -oPhoto.offsetWidth + 'px';
			oPhoto.style.opacity = 0;
			startMove(oPhoto, {marginLeft:0,opacity:100},15,function(){
				oH2.style.left = 400 + 'px';
				oH2.style.opacity = 0;
				oH3.style.left = -100 + 'px'
				oH3.style.opacity = 0;
				startMove(oH2, {left:150,opacity:100},30);
				startMove(oH3, {left:100,opacity:100},30);
			});
			
		}
	}
	(function (){
		var oS=document.createElement('script');
			
		oS.type='text/javascript';
		oS.src='http://www.zhinengshe.com/zpi/zns_demo.php?id=3134';
			
		document.body.appendChild(oS);
	})();
}
