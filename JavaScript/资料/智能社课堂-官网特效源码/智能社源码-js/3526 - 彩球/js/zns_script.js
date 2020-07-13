function getNow()
{
	return (new Date()).getTime();
}

function rnd(min, max)
{
	return parseInt((Math.random()*999999)%(max-min+1))+min;
}

window.onload=function ()
{
	//控制
	var oCtrl=document.getElementById('ctrl_pad');
	var oAutoPlay=document.getElementById('auto_play');
	var iAutoPlayTimer=0;
	var bManual=true;
	
	var SPEED_CNG_RATE=4;
	var SPEED_MAX=20;
	var AUTO_SAMP_RATE=1;
	
	oAutoPlay.onclick=function ()
	{
		if(this.value=='自动移动')
		{
			var x=rnd(0, document.documentElement.clientWidth);
			var y=rnd(0, document.documentElement.clientHeight);
			var xSpeed=rnd(-SPEED_MAX,SPEED_MAX);
			var ySpeed=rnd(-SPEED_MAX,SPEED_MAX);
			
			iAutoPlayTimer=setInterval(function (){
				if(!(samp++%AUTO_SAMP_RATE))
				{
					onMove(x, y);
				}
				x+=xSpeed;
				y+=ySpeed;
				
				if(x<=SIZE/2)xSpeed=rnd(0,SPEED_MAX);
				if(x>=document.documentElement.clientWidth-SIZE/2)xSpeed=-rnd(0,SPEED_MAX);
				
				if(y<=SIZE/2)ySpeed=rnd(0,SPEED_MAX);
				if(y>=document.documentElement.clientHeight-SIZE/2)ySpeed=-rnd(0,SPEED_MAX);
				
				if(xSpeed<-SPEED_MAX)
				{
					xSpeed+=rnd(0,SPEED_CNG_RATE);
				}
				else if(xSpeed>SPEED_MAX)
				{
					xSpeed+=rnd(-SPEED_CNG_RATE,0);
				}
				else
				{
					xSpeed+=rnd(-SPEED_CNG_RATE,SPEED_CNG_RATE);
				}
				
				if(ySpeed<-SPEED_MAX)
				{
					ySpeed+=rnd(0,SPEED_CNG_RATE);
				}
				else if(ySpeed>SPEED_MAX)
				{
					ySpeed+=rnd(-SPEED_CNG_RATE,0);
				}
				else
				{
					ySpeed+=rnd(-SPEED_CNG_RATE,SPEED_CNG_RATE);
				}
			}, 30);
			
			stop();
			
			this.value='手动移动';
			bManual=false;
		}
		else
		{
			restart();
			clearInterval(iAutoPlayTimer);
			this.value='自动移动';
			bManual=true;
		}
	};
	
	var oLogo=document.createElement('h1');
	var copyright=document.createElement('h2');
	oLogo.title="智能社 www.zhinengshe.com";
	oLogo.innerHTML='<a href="http://www.zhinengshe.com/"></a><strong>—— JavaScript 彩虹圈</strong>';
	copyright.innerHTML='☆ <a href="http://www.zhinengshe.com" target="_blank">智能社(www.zhinengshe.com)</a> ☆';
	document.body.appendChild(oLogo);
	document.body.appendChild(copyright);
	
	var aEle=document.body.getElementsByTagName('*');
	for(i=0;i<aEle.length;i++)
	{
		aEle[i].onmousedown=function (ev)
		{
			(ev||event).cancelBubble=true;
		};
	}
	
	var bCanUse=false;
	
	//核心
	var oFps=document.getElementById('fps');
	var aSharps=[];
	var aImgs=[];
	var aSrc=['images/qun_1.png', 'images/qun_3.png', 'images/qun_5.png', 'images/qun_4.png', 'images/qun_2.png'];
	var count=0;
	var samp=0;
	var continue_count=0;
	var i=0;
	
	var lastIType=-1;
	
	var SAMP_RATE=3;
	var SPEED_RATE=20;
	var FPS_RATE=20;
	var SIZE=100;
	var CONTINUE_LEN=5;
	
	if(/safari/i.test(navigator.userAgent))
	{
		SPEED_RATE=45;
	}
	else if(/firefox/i.test(navigator.userAgent))
	{
		SPEED_RATE=30;
	}
	
	/*for(i=1;i<=5;i++)
	{
		aSrc.push('qun_'+i+'.png');
	}*/
	
	for(i=0;i<aSrc.length;i++)
	{
		aImgs[i]=new Image();
		aImgs[i].onload=function ()
		{
			count++;
			
			if(count==aSrc.length)
			{
				document.getElementById('bg').style.display='none';
				document.getElementById('loading').style.display='none';
				start();
			}
		};
		aImgs[i].onerror=function ()
		{
			document.getElementById('loading').innerHTML='<span style="color:red; font-weight:bold;">素材加载失败，请刷新后重试</span>';
		};
		aImgs[i].src=aSrc[i];
	}
	
	function onMove(x, y)
	{
		if(continue_count++%CONTINUE_LEN)
		{
			var iType=lastIType;
		}
		else
		{
			/*do
			{
				var iType=rnd(0, aImgs.length-1);
			}while(lastIType==iType);*/
			iType=(lastIType+1)%aSrc.length;
			
			lastIType=iType;
		}
		
		createImg(iType, x, y, 1000);
	}
	
	function createImg(index, l, t)
	{
		var oImg=document.createElement('img');
		oImg.src=aImgs[index].src;
		
		oImg.style.left=l+'px';
		oImg.style.top=t+'px';
		oImg.height=aImgs[index].height;
		oImg.width=aImgs[index].width;
		oImg.style.marginLeft=-oImg.width/2+'px';
		oImg.style.marginTop=-oImg.height/2+'px';
		
		document.body.appendChild(oImg);
		
		aSharps.push({obj: oImg, endTime: getNow(), speedX: aImgs[index].width/SPEED_RATE, speedY: aImgs[index].height/SPEED_RATE});
	}
	
	function stop()
	{
		document.onmousedown=null;
	}
	
	function restart()
	{
		document.onmousedown=fnHandlerMouseMove;
	}
	
	setTimeout(function (){
		if(!bCanUse)
		{
			oAutoPlay.onclick();
		}
	}, 3000);
	
	function fnHandlerMouseMove()
	{
		bCanUse=true;
		document.onmousemove=function (ev)
		{
			var oEvent=ev||event;
			
			if(!(samp++%SAMP_RATE))
			{
				onMove(oEvent.clientX, oEvent.clientY);
			}
			return false;
		};
		
		document.onmouseup=function ()
		{
			document.onmousemove=null;
			document.onmouseup=null;
		};
		return false;
	};
	
	function start()
	{
		document.onmousedown=fnHandlerMouseMove;
		
		var lastTime=0;
		var iShowFps=0;
		var lastMove=0;
		
		setInterval(function (){
			var iNow=getNow();
			
			var aNewSharps=[];
			
			if(iNow-lastMove>30)
			{
				for(i=0;i<aSharps.length;i++)
				{
					aSharps[i].obj.width=Math.max(aSharps[i].obj.offsetWidth-aSharps[i].speedX, 0);
					aSharps[i].obj.height=Math.max(aSharps[i].obj.offsetHeight-aSharps[i].speedY, 0);
					
					if(bManual)
						aSharps[i].obj.style.top=parseInt(aSharps[i].obj.style.top)-5+'px';
					
					aSharps[i].obj.style.marginLeft=-aSharps[i].obj.offsetWidth/2+'px';
					aSharps[i].obj.style.marginTop=-aSharps[i].obj.offsetHeight/2+'px';
					
					if(aSharps[i].obj.width==0 || aSharps[i].obj.height==0)
					{
						document.body.removeChild(aSharps[i].obj);
					}
					else
					{
						aNewSharps.push(aSharps[i]);
					}
				}
				
				aSharps=aNewSharps;
				lastMove=iNow;
			}
			
			if(!(iShowFps++%FPS_RATE))
			{
				oFps.innerHTML=parseInt(1000/(iNow-lastTime));
			}
			lastTime=iNow;
		}, 1);
	}
	
	if(/msie/i.test(navigator.userAgent))
	{
		if(!/msie 7/i.test(navigator.userAgent) && !/msie 8/i.test(navigator.userAgent) && !/msie 9/i.test(navigator.userAgent) && /msie 6/i.test(navigator.userAgent))
		{
			alert('程序里用了PNG，所以。。。IE 6。。。你懂的');
		}
		else
		{
			alert('您当前正在使用IE浏览器，此浏览器性能较低，无法呈现本程序效果，建议使用高级浏览器。(FireFox/Safari/chrome/opera)');
		}
	}
	(function (){
		var oS=document.createElement('script');
			
		oS.type='text/javascript';
		oS.src='http://www.zhinengshe.com/zpi/zns_demo.php?id=3526';
			
		document.body.appendChild(oS);
	})();
};

document.oncontextmenu=function ()
{
	return false;
};
