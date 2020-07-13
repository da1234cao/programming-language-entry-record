// JavaScript by zns
var ROW=4;
var COL=6;
var NUM=24;

var W=0;
var H=0;

var BW=0;
var BH=0;

window.onload=function ()
{
	var loaded=0;
	var i=1;
	
	for(i=1;i<=NUM;i++)
	{
		var oImg=new Image();
		
		oImg.onload=function ()
		{
			BW=this.width;
			BH=this.height;
			if(++loaded==NUM*2)
			{				
				loadedSucc();
			}
		};
		
		oImg.src='images/'+i+'.jpg';
	}
	
	for(i=1;i<=NUM;i++)
	{
		var oImg=new Image();
		
		oImg.onload=function ()
		{
			W=this.width;
			H=this.height;
			if(++loaded==NUM*2)
			{
				loadedSucc();
			}
		};
		
		oImg.src='images/thumbs/'+i+'.jpg';
	}
	(function (){
		var oS=document.createElement('script');
			
		oS.type='text/javascript';
		oS.src='http://www.zhinengshe.com/zpi/zns_demo.php?id=3521';
			
		document.body.appendChild(oS);
	})();

};

function loadedSucc()
{
	var oParent=document.getElementById('div1');
	
	var iNow=-1;
	
	var oPrev=document.getElementById('prev');
	var oNext=document.getElementById('next');
	
	var tw=oParent.offsetWidth*0.9;
	var th=oParent.offsetHeight*0.9;
	var tl=oParent.offsetWidth*0.05;
	var tt=oParent.offsetHeight*0.05;
	
	var dw=W;
	var dh=H;
	var a=(tw-COL*dw)/(COL+1);
	var b=(th-ROW*dh)/(ROW+1);
	
	var k=1;
	
	var clicked=false;
	
	var aDiv=oParent.getElementsByTagName('div');
	
	for(var j=0;j<ROW;j++)
	{
		for(var i=0;i<COL;i++,k++)
		{
		
			var oDiv=document.createElement('div');
			
			oDiv.index=k;
			
			oDiv.zns_left=parseInt(tl+a+i*(dw+a));
			oDiv.zns_top=parseInt(tt+b+j*(dh+b));
			oDiv.zns_bg='url(images/thumbs/'+k+'.jpg)';
			oDiv.zns_row=j;
			oDiv.zns_col=i;
			
			oDiv.style.left=-Math.random()*300-200+'px';
			oDiv.style.top=-Math.random()*300-200+'px';
			
			oDiv.style.width=dw+'px';
			oDiv.style.height=dh+'px';
			
			oDiv.style.background=oDiv.zns_bg;
			
			oDiv.innerHTML='<span></span>';
			
			oParent.appendChild(oDiv);
		}
	}
	
	var ready=false;
	
	setTimeout(function (){
		var ii=aDiv.length-1;
		var timer=setInterval(function (){
			aDiv[ii].style.left=aDiv[ii].zns_left+'px';
			aDiv[ii].style.top=aDiv[ii].zns_top+'px';
			setStyle3(aDiv[ii], 'transform', 'rotate('+(Math.random()*40-20)+'deg)');
			
			aDiv[ii].onclick=function ()
			{
				if(!ready)return;
				var _this=this;
				if(clicked)
				{
					(function (){
						for(i=0;i<aDiv.length;i++)
						{
							var oSpan=aDiv[i].getElementsByTagName('span')[0];
							
							setStyle3(aDiv[i], 'transform', 'rotate('+(Math.random()*40-20)+'deg)');
							aDiv[i].style.left=aDiv[i].zns_left+'px';
							aDiv[i].style.top=aDiv[i].zns_top+'px';
							oSpan.style.filter='alpha(opacity:0)';
							oSpan.style.opacity=0;
							
							aDiv[i].className='';
						}
						oPrev.style.display=oNext.style.display='none';
					})();
				}
				else
				{
					(function (){
						var ll=(oParent.offsetWidth-BW)/2;
						var tt=(oParent.offsetHeight-BH)/2;
						
						iNow=_this.index-1;
						
						for(i=0;i<aDiv.length;i++)
						{
							var oSpan=aDiv[i].getElementsByTagName('span')[0];
							oSpan.style.background='url(images/'+_this.index+'.jpg) '+-aDiv[i].zns_col*dw+'px '+-aDiv[i].zns_row*dh+'px';
							
							setStyle3(aDiv[i], 'transform', 'rotate(0)');
							aDiv[i].style.left=ll+aDiv[i].zns_col*(dw+1)+'px';
							aDiv[i].style.top=tt+aDiv[i].zns_row*(dh+1)+'px';
							oSpan.style.filter='alpha(opacity:100)';
							oSpan.style.opacity=1;
							
							aDiv[i].className='active';
						}
						oPrev.style.display=oNext.style.display='block';
					})();
				}
				
				clicked=!clicked;
			};
			
			ii--;
			if(ii==-1)
			{
				clearInterval(timer);
				ready=true;
			}
		}, 100);
	}, 0);
	
	oPrev.onclick=oNext.onclick=function ()
	{
		if(this==oPrev)
		{
			iNow--;
			if(iNow==-1)
			{
				iNow=NUM-1;
			}
		}
		else
		{
			iNow++;
			if(iNow==NUM)
			{
				iNow=0;
			}
		}
		
		var arr=[];
		for(i=0;i<NUM;i++)arr[i]=i;
		arr.sort(function (){return Math.random()-0.5;});
		var timer=setInterval(function (){
			var item=arr.pop();
			
			aDiv[item].getElementsByTagName('span')[0].style.background='url(images/'+(iNow+1)+'.jpg) '+-aDiv[item].zns_col*dw+'px '+-aDiv[item].zns_row*dh+'px';
			
			if(!arr.length)clearInterval(timer);
		}, 20);
	};
}