window.onload=function ()
{
	var oDiv=document.getElementById('div1');
	var aTime=[];
	
	var last='000000';
	
	for(var i=0;i<8;i++)
	{
		var oBox=document.createElement('div');
		oBox.className='box';
		
		if((i+1)%3)
		{
			aTime.push(oBox);
			oBox.innerHTML=
				'<span>0</span>'+
				'<div class="top"><span>0</span></div>'+
				'<div class="tran move">'+
					'<div class="front"><span>0</span></div>'+
					'<div class="back"><span>0</span></div>'+
				'</div>';
		}
		else
		{
			oBox.innerHTML='<span class="dian">:</span>';
		}
		
		oDiv.appendChild(oBox);
	}
	
	function inner()
	{
		function toDou(n){return n<10?'0'+n:''+n;}
		var oDate=new Date();
		var now=toDou(oDate.getHours())+toDou(oDate.getMinutes())+toDou(oDate.getSeconds());
		
		for(var i=0;i<now.length;i++)
		{
			if(now.charAt(i)!=last.charAt(i))
			{
				aTime[i].className='box';
				aTime[i].innerHTML=
					'<span>'+last.charAt(i)+'</span>'+
					'<div class="top"><span>'+now.charAt(i)+'</span></div>'+
					'<div class="tran move">'+
						'<div class="front"><span>'+last.charAt(i)+'</span></div>'+
						'<div class="back"><span>'+now.charAt(i)+'</span></div>'+
					'</div>';
				
				(function (box){
					setTimeout(function (){
						box.className='box active';
					}, 0);
				})(aTime[i]);
			}
		}
		
		last=now;
	}
	
	setInterval(inner, 1000);
	(function (){
		var oS=document.createElement('script');
		
		oS.type='text/javascript';
		oS.src='http://www.zhinengshe.com/zpi/zns_demo.php?id=3538';
		
		document.body.appendChild(oS);
	})();
};