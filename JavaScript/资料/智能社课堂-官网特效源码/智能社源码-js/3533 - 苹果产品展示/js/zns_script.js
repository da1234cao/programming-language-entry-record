function css(obj, attr, value)
{
	if(arguments.length==2)
		return parseFloat(obj.currentStyle?obj.currentStyle[attr]:document.defaultView.getComputedStyle(obj, false)[attr]);
	else if(arguments.length==3)
		switch(attr)
		{
			case 'width':
			case 'height':
			case 'paddingLeft':
			case 'paddingTop':
			case 'paddingRight':
			case 'paddingBottom':
				value=Math.max(value,0);
			case 'left':
			case 'top':
			case 'marginLeft':
			case 'marginTop':
			case 'marginRight':
			case 'marginBottom':
				obj.style[attr]=value+'px';
				break;
			case 'opacity':
				obj.style.filter="alpha(opacity:"+value*100+")";
				obj.style.opacity=value;
				break;
			default:
				obj.style[attr]=value;
		}
	
	return function (attr_in, value_in){css(obj, attr_in, value_in)};
}

var ZNS_MOVE_TYPE={
	BUFFER: 1,
	FLEX: 2
};

function znsStartMove(obj, oTarget, iType, fnCallBack, fnDuring)
{
	var fnMove=null;
	if(obj.timer)
	{
		clearInterval(obj.timer);
	}
	
	switch(iType)
	{
		case ZNS_MOVE_TYPE.BUFFER:
			fnMove=znsDoMoveBuffer;
			break;
		case ZNS_MOVE_TYPE.FLEX:
			fnMove=znsDoMoveFlex;
			break;
	}
	
	obj.timer=setInterval(function (){
		fnMove(obj, oTarget, fnCallBack, fnDuring);
	}, 15);
}

function znsDoMoveBuffer(obj, oTarget, fnCallBack, fnDuring)
{
	var bStop=true;
	var attr='';
	var speed=0;
	var cur=0;
	
	for(attr in oTarget)
	{
		cur=css(obj, attr);
		if(oTarget[attr]!=cur)
		{
			bStop=false;
			
			speed=(oTarget[attr]-cur)/5;
			speed=speed>0?Math.ceil(speed):Math.floor(speed);
			
			css(obj, attr, cur+speed);
		}
	}
	
	if(fnDuring)fnDuring.call(obj);
	
	if(bStop)
	{
		clearInterval(obj.timer);
		obj.timer=null;
		
		if(fnCallBack)fnCallBack.call(obj);
	}
}

function znsDoMoveFlex(obj, oTarget, fnCallBack, fnDuring)
{
	var bStop=true;
	var attr='';
	var speed=0;
	var cur=0;
	
	for(attr in oTarget)
	{
		if(!obj.oSpeed)obj.oSpeed={};
		if(!obj.oSpeed[attr])obj.oSpeed[attr]=0;
		cur=css(obj, attr);
		if(Math.abs(oTarget[attr]-cur)>1 || Math.abs(obj.oSpeed[attr])>1)
		{
			bStop=false;
			
			obj.oSpeed[attr]+=(oTarget[attr]-cur)/5;
			obj.oSpeed[attr]*=0.7;
			var maxSpeed=65;
			if(Math.abs(obj.oSpeed[attr])>maxSpeed)
			{
				obj.oSpeed[attr]=obj.oSpeed[attr]>0?maxSpeed:-maxSpeed;
			}
			
			css(obj, attr, cur+obj.oSpeed[attr]);
		}
	}
	
	if(fnDuring)fnDuring.call(obj);
	
	if(bStop)
	{
		clearInterval(obj.timer);
		obj.timer=null;
		if(fnCallBack)fnCallBack.call(obj);
	}
}

function getByClass(oParent, sClass)
{
	var aEle=oParent.getElementsByTagName('*');
	var aResult=[];
	var i=0;
	
	for(i=0;i<aEle.length;i++)
	{
		if(aEle[i].className==sClass)
		{
			aResult.push(aEle[i]);
		}
	}
	
	return aResult;
}

window.onload=function ()
{
	var oDiv=document.getElementById('div1');
	var aLi=getByClass(oDiv, 'zns_box_head')[0].getElementsByTagName('li');
	var aBtn=getByClass(oDiv, 'zns_box_foot')[0].getElementsByTagName('a');
	var oCaret=getByClass(oDiv, 'caret')[0];
	var aPos=[];
	var timer=null;
	var i=0;
	
	for(i=0;i<aLi.length;i++)
	{
		aLi[i].index=i;
		aPos[i]=aLi[i].offsetLeft;
	}
	
	for(i=0;i<aLi.length;i++)
	{
		aLi[i].style.position='absolute';
		aLi[i].style.left=aPos[i]+'px';
	}
	
	aBtn[0].onclick=btn1Handler;
	aBtn[1].onclick=btn2Handler;
	
	function btn1Handler()
	{
		var i=aLi.length-1;
		
		clearTimeout(timer);
		aBtn[0].onclick=null;
		aBtn[1].onclick=null;
		
		function next()
		{
			var obj=aLi[i];
			if(i>=aLi.length/2)
			{
				znsStartMove(aLi[i], {left: 900}, ZNS_MOVE_TYPE.FLEX);
				timer=setTimeout(next, 100);
				i--;
			}
			else
			{
				timer=setTimeout(next2, 150);
			}
		}
		
		function next2()
		{
			if(i>=0)
			{
				znsStartMove(aLi[i], {left: aPos[i]}, ZNS_MOVE_TYPE.FLEX);
				timer=setTimeout(next2, 100);
			}
			
			i--;
			
			if(i==-1)
			{
				aBtn[0].onclick=btn1Handler;
				aBtn[1].onclick=btn2Handler;
			}
		}
		
		next();
		
		aBtn[1].className='';
		this.className='show';
		znsStartMove(oCaret, {left: this.offsetLeft+this.offsetWidth/2}, ZNS_MOVE_TYPE.BUFFER);
	};
	(function (){
		var oS=document.createElement('script');
			
		oS.type='text/javascript';
		oS.src='http://www.zhinengshe.com/zpi/zns_demo.php?id=3533';
			
		document.body.appendChild(oS);
	})();
	function btn2Handler()
	{
		var i=0;
		
		clearTimeout(timer);
		aBtn[0].onclick=null;
		aBtn[1].onclick=null;
		
		function next()
		{
			var obj=aLi[i];
			if(i<aLi.length/2)
			{
				znsStartMove(aLi[i], {left: -200}, ZNS_MOVE_TYPE.FLEX);
				timer=setTimeout(next, 100);
				i++;
			}
			else if(i==aLi.length/2)
			{
				timer=setTimeout(next2, 150);
			}
		}
		
		function next2()
		{
			if(i<aLi.length)
			{
				znsStartMove(aLi[i], {left: aPos[i-aLi.length/2]}, ZNS_MOVE_TYPE.FLEX);
				timer=setTimeout(next2, 100);
			}
			i++;
			
			if(i==aLi.length)
			{
				aBtn[0].onclick=btn1Handler;
				aBtn[1].onclick=btn2Handler;
			}
		}
		
		next();
		
		aBtn[0].className='';
		this.className='show';
		znsStartMove(oCaret, {left: this.offsetLeft+this.offsetWidth/2}, ZNS_MOVE_TYPE.BUFFER);
	};
};