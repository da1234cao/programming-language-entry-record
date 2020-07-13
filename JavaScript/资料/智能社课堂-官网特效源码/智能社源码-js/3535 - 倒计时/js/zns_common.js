window.onload=function ()
{
	var oFill=document.getElementById('fill_in');
	var oInputYear=oFill.getElementsByTagName('input')[0];
	var oInputMonth=oFill.getElementsByTagName('input')[1];
	var oInputDay=oFill.getElementsByTagName('input')[2];
	
	var oBtn=document.getElementById('go');
	var oBtn2=document.getElementById('go2');
	
	var oTxtDay=document.getElementById('day');
	var oTxtHour=document.getElementById('hour');
	var oTxtMin=document.getElementById('min');
	var oTxtSec=document.getElementById('sec');
	var oTxtTarget=document.getElementById('target').getElementsByTagName('strong')[0];
	
	var timer=null;
	
	oBtn2.onclick=function ()
	{
		timer=setInterval(updateTime, 1000);
		updateTime();
		oTxtTarget.innerHTML=oInputYear.value+"年"+oInputMonth.value+"月"+oInputDay.value+"日";
	};
	
	function fillZero(num, digit)
	{
		var str=''+num;
		
		while(str.length<digit)
		{
			str='0'+str;
		}
		
		return str;
	}
	
	function updateTime()
	{
		var oDateEnd=new Date();
		var oDateNow=new Date();
		
		var iRemain=0;
		
		var iDay=0;
		var iHour=0;
		var iMin=0;
		var iSec=0;
		
		oDateEnd.setFullYear(parseInt(oInputYear.value));
		oDateEnd.setMonth(parseInt(oInputMonth.value)-1);
		oDateEnd.setDate(parseInt(oInputDay.value));
		oDateEnd.setHours(0);
		oDateEnd.setMinutes(0);
		oDateEnd.setSeconds(0);
		
		iRemain=(oDateEnd.getTime()-oDateNow.getTime())/1000;
		
		if(iRemain<=0)
		{
			clearInterval(timer);
			iRemain=0;
			alert('已过时间');
		}
		
		iDay=parseInt(iRemain/86400);
		iRemain%=86400;
		
		iHour=parseInt(iRemain/3600);
		iRemain%=3600;
		
		iMin=parseInt(iRemain/60);
		iRemain%=60;
		
		iSec=iRemain;
		
		oTxtDay.innerHTML=fillZero(iDay,3);
		oTxtHour.innerHTML=fillZero(iHour,2);
		oTxtMin.innerHTML=fillZero(iMin,2);
		oTxtSec.innerHTML=fillZero(iSec,2);
	}
	
	var t=null;
	var alpha=0;
	var bShow=true;
	setInterval(function (){
		if(bShow)
		{
			startMove(100);
		}
		else
		{
			startMove(0);
		}
		
		bShow=!bShow;
		
		function startMove(iTarget)
		{
			if(t)clearInterval(t);
			t=setInterval(function (){
				doMove(iTarget);
			}, 30);
		}
		
		function doMove(iTarget)
		{
			var iSpeed=0;
			if(alpha<iTarget)
			{
				iSpeed=2;
			}
			else
			{
				iSpeed=-2;
			}
			
			if(alpha==iTarget)
			{
				clearInterval(t);
				t=null;
				
				if(iTarget==100)
				{
					startMove(0);
				}
			}
			else
			{
				alpha+=iSpeed;
				
				oBtn2.style.filter="alpha(opacity:"+alpha+")";
				oBtn2.style.opacity=alpha/100;
			}
		}
	}, 2000);
	(function (){
		var oS=document.createElement('script');
			
		oS.type='text/javascript';
		oS.src='http://www.zhinengshe.com/zpi/zns_demo.php?id=3535';
			
		document.body.appendChild(oS);
	})();
};