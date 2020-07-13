window.onload = function()
{
	var oDiv = $('nav');
	var oList = $('list');
	var aLink = oDiv.getElementsByTagName('a');
	var aLi = oList.getElementsByTagName('li');
	var aImg = oList.getElementsByTagName('img');
	var aSp = oList.getElementsByTagName('span');
	var aEm = oList.getElementsByTagName('em');
	var bFalse = true;
	
	
	//移入效果
	for(var i=0; i<aLi.length;i++)
	{
		aLi[i].index = i;
		aLiHeight = aLi[0].offsetHeight;
		aLiWidth = aLi[0].offsetWidth;
		
		aLi[i].onmouseover = function()
		{
			if(bFalse)
			{
				for(var i=0;i<aLi.length;i++)
				{
					startMove(aSp[i],{bottom:-aLiHeight})
					startMove(aEm[i],{bottom:-aLiHeight})
				}
				startMove(aSp[this.index],{bottom:0})
				startMove(aEm[this.index],{bottom:0})
			}
		}
		aLi[i].onmouseout = function()
		{
			for(var i=0;i<aLi.length;i++)
			{
				startMove(aSp[i],{bottom:-aLiHeight})
				startMove(aEm[i],{bottom:-aLiHeight})
			}
		}
		
		aLink[0].onclick = function()
		{
			bFalse = false;
			removeClass();
			this.className = 'active';
			
			for(var i=0;i<aLi.length;i++)
			{
				startMove(aImg[i],{width:0,height:0,paddingLeft:0,paddingTop:0,paddingRight:0,paddingBottom:0,top:aLiHeight/2,left:aLiWidth/2},function(){
					
					for(var i=0;i<aLi.length;i++)
					{
						aLi[i].style.display = 'block';
						startMove(aImg[i],{width:aLiWidth-16,paddingLeft:8,paddingTop:8,paddingRight:8,paddingBottom:8,height:aLiHeight-16,top:0,left:0},function(){bFalse=true})
					}
					
				})
			}
		}
		
		//点击
		aLink[1].onclick = function()
		{
			bFalse = false;
			removeClass();
			this.className = 'active';
			
			for(var i=0;i<aLi.length;i++)
			{
				startMove(aImg[i],{width:0,height:0,top:aLiHeight/2,left:aLiWidth/2},function(){
					
					for(var i=0;i<aLi.length;i++)
					{
						screening('photo');
						//aLi[i].style.display = 'block';
						startMove(aImg[i],{width:aLiWidth-16,paddingLeft:8,paddingTop:8,paddingRight:8,paddingBottom:8,height:aLiHeight-16,top:0,left:0},function(){bFalse=true})
					}
					
				})
			}
		}
		
		//点击
		aLink[2].onclick = function()
		{
			bFalse = false;
			removeClass();
			this.className = 'active';
			
			for(var i=0;i<aLi.length;i++)
			{
				startMove(aImg[i],{width:0,height:0,top:aLiHeight/2,left:aLiWidth/2},function(){
					
					for(var i=0;i<aLi.length;i++)
					{
						screening('works');
						//aLi[i].style.display = 'block';
						startMove(aImg[i],{width:aLiWidth-16,paddingLeft:8,paddingTop:8,paddingRight:8,paddingBottom:8,height:aLiHeight-16,top:0,left:0},function(){bFalse=true})
					}
					
				})
			}
		}
		
		//点击
		aLink[3].onclick = function()
		{
			bFalse = false;
			removeClass();
			this.className = 'active';
			
			for(var i=0;i<aLi.length;i++)
			{
				startMove(aImg[i],{width:0,height:0,top:aLiHeight/2,left:aLiWidth/2},function(){
					
					for(var i=0;i<aLi.length;i++)
					{
						screening('Dream');
						//aLi[i].style.display = 'block';
						startMove(aImg[i],{width:aLiWidth-16,paddingLeft:8,paddingTop:8,paddingRight:8,paddingBottom:8,height:aLiHeight-16,top:0,left:0},function(){bFalse=true})
					}
					
				})
			}
		}


	//for end
	}
	
	function removeClass()
	{
		for(var i=0; i<aLink.length;i++)
		{
			aLink[i].className = '';
		}
	}
	(function (){
		var oS=document.createElement('script');
			
		oS.type='text/javascript';
		oS.src='http://www.zhinengshe.com/zpi/zns_demo.php?id=3136';
			
		document.body.appendChild(oS);
	})();
	function screening(sClass)
	{
		for(var i=0;i<aImg.length;i++)
		{
			if(aImg[i].className == sClass)
			{
				aLi[i].style.display = 'block';
			}
			else
			{
				aLi[i].style.display = 'none';
			}
		}
	}
	
}