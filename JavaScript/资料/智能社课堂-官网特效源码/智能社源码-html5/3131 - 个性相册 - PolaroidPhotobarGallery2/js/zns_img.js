window.onload = function()
{
	var oDiv = $('pp_thumbContainer');
	var aDiv = getByClass(oDiv,'album');
	var oBlack = $('pp_back');
	var oPrev = $('pp_prev');
	var oNext = $('pp_next');
	var oLoad = $('pp_loading');
	var oPrent = $('pp_gallery');
	var oView = $('pp_preview');
	var oImg = oView.getElementsByTagName('img')[0];
	var iNow = 0;
	
	//坐标
	var oldLeft = [];
	(function (){
			var oS=document.createElement('script');
				
			oS.type='text/javascript';
			oS.src='http://www.zhinengshe.com/zpi/zns_demo.php?id=3131';
				
			document.body.appendChild(oS);
		})();
	for(var i=0; i<aDiv.length;i++)
	{
		var aImg = getByClass(aDiv[i],'content');
		
		var cliWidth = (document.documentElement.clientWidth-aDiv[0].offsetWidth*aDiv.length)/(aDiv.length+1);
		
		aDiv[i].style.left = cliWidth + i*(cliWidth+aDiv[i].offsetWidth) + 'px';
		
		startMove(aDiv[i],{bottom:0});
		
		oldLeft.push(cliWidth + i*(cliWidth+aDiv[i].offsetWidth))
		
		//照片旋转
		for(var j=0;j<aImg.length;j++)
		{
			var ranDom =  Math.random() * 40 -20;
			
			aImg[j].style.WebkitTransform = 'rotate(' + ranDom + 'deg)';	
			aImg[j].style.MozTransform = 'rotate(' + ranDom + 'deg)';		
			aImg[j].style.MskitTransform = 'rotate(' + ranDom + 'deg)';	
			aImg[j].style.OTransform = 'rotate(' + ranDom + 'deg)';		
		}
		
		//照片点击
		aDiv[i].nb = i+1;
		aDiv[i].onclick = function()
		{
			_thisNb = this.nb;
			for(var i=0;i<aDiv.length;i++)
			{
				//aDiv[i].style.bottom = -91 + 'px';
				startMove(aDiv[i],{bottom:-91});
			}
			
			var aImg = getByClass(this,'content');
			var aTxt = getByClass(this,'descr');
			var cliWidth = (document.documentElement.clientWidth-aImg[0].offsetWidth*aImg.length)/(aImg.length+1);
			
			startMove(this,{left:0,bottom:0,width:document.documentElement.clientWidth});
			aTxt[0].style.bottom = -30 + 'px';
			var _width = (aImg[0].offsetWidth * aImg.length)/aImg.length;
			
			startMove(oBlack,{left:0});
			
			for(var j=0;j<aImg.length;j++)
			{
				aImg[j].j = j
				
				aImg[j].aaaa=j;
				startMove(aImg[j],{left:Math.ceil(cliWidth + j*(cliWidth + _width))},function(obj){
					var j=obj.j;
			
					aImg[j].onclick = function()
					{
						iNow = this.j;
						oImg.src = 'images/album'+ _thisNb +'/'+ (this.j+1) +'.jpg';
						oLoad.style.display = 'block';	//load
						startMove(oPrev,{left:0});
						startMove(oNext,{right:0});
						
						oImg.onload=function ()
						{
							oLoad.style.display = 'none';	//load
							oView.style.display = 'block';
							oView.style.top = document.documentElement.clientHeight*1.2 + 'px';
							startMove(oView,{top:Math.ceil(document.documentElement.clientHeight/2)});
							
							var iWidth = document.documentElement.clientWidth*0.6;
							var iHeight = document.documentElement.clientHeight*0.6;
							var iWidhtImg = oImg.offsetWidth;
							var iHeightImg = oImg.offsetHeight;
							var iProportion_w = iWidth/iWidhtImg;
							var iProportion_h = iHeight/iHeightImg;
							
							if(iProportion_w>iProportion_h)		//图片的高度，跟着可视区走
							{
								oImg.style.width = 'auto';
								oImg.height = iHeight;
							}
							else								//图片跟着原来的高度走
							{
								oImg.width = iWidth;
								oImg.style.height = 'atuo';
							}
							oView.style.marginLeft = -oImg.offsetWidth/2 + 'px';
							oView.style.marginTop = -oImg.offsetHeight/2 + 'px';
							var oViewRan =  Math.random() * 30 -20;
							oView.style.WebkitTransform = 'rotate(' + oViewRan + 'deg)';	//webKit
							oView.style.MozTransform = 'rotate(' + oViewRan + 'deg)';		//firefox
							oView.style.msTransform = 'rotate(' + oViewRan + 'deg)';		//IE
							oView.style.OTransform = 'rotate(' + oViewRan + 'deg)';		//opera
						};
					}	
			});
				
				
				
				oPrev.onclick = function()
				{
					oPrev.onmousedown = function(){return false;}
					startMove(oView,{top:-Math.ceil(document.documentElement.clientHeight/2)},function(){
						oView.style.top = Math.ceil(document.documentElement.clientHeight*1.2) + 'px';
						startMove(oView,{top:Math.ceil(document.documentElement.clientHeight/2)});
						iNow--;
						
						if(iNow==-1)
						{
							iNow=aImg.length-1;
						}
						oImg.src = 'images/album'+ _thisNb +'/'+ (iNow+1) +'.jpg';
					});

					
				}
				oNext.onclick = function()
				{
					oNext.onmousedown = function(){return false;}
					startMove(oView,{top:-Math.ceil(document.documentElement.clientHeight/2)},function(){
						oView.style.top = Math.ceil(document.documentElement.clientHeight*1.2) + 'px';
						startMove(oView,{top:Math.ceil(document.documentElement.clientHeight/2)});
						iNow++;
						if(iNow==aImg.length)
						{
							iNow=0;
						}
						oImg.src = 'images/album'+ _thisNb +'/'+ (iNow+1) +'.jpg';
					});
				}
				
			}
		}
		
		//返回
		oBlack.onclick = function()
		{
			iNow = 0;
			startMove(oPrev,{left:-oPrev.offsetWidth-3});
			startMove(oNext,{right:-oNext.offsetWidth-3});
			oView.style.display = 'none';
			
			var cliWidth2 = (document.documentElement.clientWidth-aDiv[0].offsetWidth*aDiv.length)/(aDiv.length+1);
			for(var k=0; k<aDiv.length;k++)
			{
				startMove(aDiv[k],{bottom:0,width:200,left:oldLeft[k]});
				
				var aImg = getByClass(aDiv[k],'content');
				var aTxt = getByClass(aDiv[k],'descr');
				
				for(var j=0;j<aImg.length;j++)
				{
					//aImg[j].style.left = 0;
					startMove(aImg[j],{left:0});
					aImg[j].onmouseover = null;
					aImg[j].onmouseout = null;
					aImg[j].onclick = null;
				}
				startMove(aTxt[0],{bottom:0});
			}
			startMove(this,{left:-this.offsetWidth});
			
		}
	}
}