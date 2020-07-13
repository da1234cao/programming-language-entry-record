var aImg=['img/1.jpg', 'img/2.jpg', 'img/3.jpg', 'img/4.jpg', 'img/5.jpg'];
window.onload=function ()
{
	preloadImgs(aImg, loaded, function (){
		alert('图片加载失败，请刷新重试');
	}, function (pre){
		document.getElementById('loading').getElementsByTagName('span')[0].innerHTML=pre+'%';
	});
};

function preloadImgs(arr, fnSucc, fnFaild, fnProgress)
{
	var loaded=0;
	for(var i=0;i<arr.length;i++)
	{
		var oImg=new Image();
		
		oImg.onload=function ()
		{
			loaded++;
			
			fnProgress&&fnProgress(100*loaded/arr.length);
			
			if(loaded==arr.length)fnSucc&&fnSucc();
			
			this.onload=this.onerror=null;
			this.src='';
		};
		
		oImg.onerror=function ()
		{
			fnFaild&&fnFaild(this.src);
			
			fnFaild=fnSucc=fnProgress=null;
		};
		
		oImg.src=arr[i];
	}
}

function loaded()
{
	document.getElementById('loading').style.display='none';
	var oDiv=document.getElementById('div1');
	var aDiv=[];
	var MAX_DEG_X=30;
	var MAX_DEG_Y=15;
	var x=0,y=0;
	var iLastDoMove=0;
	var i=0;
	var timer=null;
	
	oDiv.style.width=aImg.length*670+'px';
	oDiv.style.marginLeft=-oDiv.offsetWidth/2+'px';
	
	for(i=0;i<aImg.length;i++)
	{
		var oNewDiv=document.createElement('div');
		oNewDiv.innerHTML='<img class="img" /><div class="img_r"></div>';
		var oImg=oNewDiv.getElementsByTagName('img')[0];
		var oImgR=oNewDiv.getElementsByTagName('div')[0];
		
		oImgR.style.background='-webkit-linear-gradient(top, rgba(0,0,0,1) 60%, rgba(0,0,0,0)), url('+aImg[i]+')';
		oImg.src=aImg[i];
		
		oNewDiv.className='item';
		
		oDiv.appendChild(oNewDiv);
		aDiv.push(oNewDiv);
	}
	
	(function (){
		var oS=document.createElement('script');
		
		oS.type='text/javascript';
		oS.src='http://www.zhinengshe.com/zpi/zns_demo.php?id=3516';
		
		document.body.appendChild(oS);
	})();
	
	document.onmousemove=function (ev)
	{
		var oEvent=ev||event;
		var oDiv=document.getElementById('div1');
		
		/*x=oEvent.clientX;
		y=oEvent.clientY;*/
		
		startMove(oEvent.clientX, oEvent.clientY);
		//document.getElementById('txt1').value=rx;
	};
	
	function startMove(iX, iY)
	{
		clearInterval(timer);
		
		iNow=new Date().getTime();
		if(iNow-iLastDoMove>30)
		{
			doMove();
			iLastDoMove=iNow;
		}
		timer=setInterval(doMove, 30);
		
		function doMove()
		{
			if(x==iX && y==iY)
			{
				clearInterval(timer);
			}
			else
			{
				iSpeed=(iX-x)/8;
				iSpeed=iSpeed>0?Math.ceil(iSpeed):Math.floor(iSpeed);
				x+=iSpeed;
				
				iSpeed=(iY-y)/8;
				iSpeed=iSpeed>0?Math.ceil(iSpeed):Math.floor(iSpeed);
				y+=iSpeed;
			}
			
			var w=document.documentElement.clientWidth;
			var h=document.documentElement.clientHeight;
			//var w=600;
			//var h=600;
			var dis=Math.sqrt(Math.pow(x-w/2,2)+Math.pow(y-h/2,2));
			
			var rx=(x-w/2)*2/w;
			var ry=-(y-h/2)*2/h;
			var tx=-rx*oDiv.offsetWidth/2;
			var ty=ry*100;
			//var scale=1-(dis/1000);
			var scale=0.6*(1-Math.abs(y-h/2)/h);
			
			oDiv.style.WebkitTransform='perspective(1000px) rotateY('+MAX_DEG_X*rx+'deg) rotateX('+MAX_DEG_Y*ry+'deg) scale('+scale+') translate('+tx+'px,'+ty+'px)';
		}
	}
}