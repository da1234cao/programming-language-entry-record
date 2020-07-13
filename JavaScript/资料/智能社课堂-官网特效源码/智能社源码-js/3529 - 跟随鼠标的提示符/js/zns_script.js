var g_aData=
[
	'技术：我们乐于和客户分享行业顶尖技术所带来的商业价值<br />价值：我们专注而不沉迷技术，注重技术的商业价值和应用<br />关注：我们为客户带来的是——低成本、高用户体验、快速响应、共同成长<br />分享：我们以自己的方式和客户分享技术成果——项目合作、人才培养',
	'智能社只做移动互联网。智能社只做移动互联网。 互联网上永远不缺诱惑，而我们只聚焦在移动互联网技术上，我们的所有目标都围绕这个核心展开。',
	'在这个时代，不做全平台是没有意义的。让用户可以自由的在各个平台间转换，并保持数据的平滑同步，这样才能让应用最大限度的服务用户，而不是限制用户。',
	'智能社为企业开发的专属APP，为企业提供手机上的展示空间，利用手机的移动特性，让用户将企业的“广告”随身携带，主动推荐给朋友，为企业节省大量广告费的同时收获更加精准的回报。'
];

var g_oTimerHide=null;

window.onload=function ()
{
	var aLi=document.getElementById('content').getElementsByTagName('li');
	
	bindTopic(aLi);
	(function (){
		var oS=document.createElement('script');
			
		oS.type='text/javascript';
		oS.src='http://www.zhinengshe.com/zpi/zns_demo.php?id=3529';
			
		document.body.appendChild(oS);
	})();
};

function bindTopic(aElement)
{
	var i=0;
	
	for(i=0;i<aElement.length;i++)
	{
		aElement[i].znsIndex=i;
		aElement[i].onmouseover=function (ev){showTopic(this.znsIndex, window.event || ev);};
		aElement[i].onmouseout=function (){hideTopic();};
		aElement[i].onmousemove=function (ev)
		{
			var oEvent=window.event || ev;
			setPosition(oEvent.clientX, oEvent.clientY);
		};
	}
}

function showTopic(index, oEvent)
{
	var oTopic=document.getElementById('topic');
	
	if(g_oTimerHide)
	{
		clearTimeout(g_oTimerHide);
	}
	
	oTopic.getElementsByTagName('div')[1].innerHTML=g_aData[index];
	oTopic.style.display='block';
	
	setPosition(oEvent.clientX, oEvent.clientY);
}

function hideTopic()
{
	var oTopic=document.getElementById('topic');
	
	if(g_oTimerHide)
	{
		clearTimeout(g_oTimerHide);
	}
	g_oTimerHide=setTimeout
	(
		function ()
		{
			oTopic.style.display='none';
		},50
	);
}

function setPosition(x, y)
{
	var top=document.body.scrollTop || document.documentElement.scrollTop;
	var left=document.body.scrollLeft || document.documentElement.scrollLeft;
	
	x+=left;
	y+=top;
	
	var oTopic=document.getElementById('topic');
	var l=x+20;
	var t=y-(oTopic.offsetHeight-20);
	var bRight=true;
	var iPageRight=left+document.documentElement.clientWidth;
	
	if(l+oTopic.offsetWidth>iPageRight)
	{
		bRight=false;
		
		l=x-(oTopic.offsetWidth+20);
		oTopic.getElementsByTagName('div')[0].className='adorn_r';
	}
	else
	{
		oTopic.getElementsByTagName('div')[0].className='adorn';
	}
	
	oTopic.style.left=l+'px';
	oTopic.style.top=t+'px';
}