Array.prototype.remove=function (w)
{
	for(var i=0;i<this.length;i++)
	{
		if(this[i]==w)
		{
			this.splice(i,1);
			return;
		}
	}
};

var aMove=[];

setInterval(function (){
	for(var i=0;i<aMove.length;i++)
	{
		aMove[i].ff();
	}
}, 30);

function getStyle(obj, attr)
{
	if(obj.currentStyle)
	{
		return obj.currentStyle[attr];
	}
	else
	{
		return getComputedStyle(obj, false)[attr];
	}
}
function getByClass(oParent,sClass)
{
	var aEle = oParent.getElementsByTagName('*');
	var aResult = [];
	var re=new RegExp('\\b'+sClass+'\\b', 'i');
	
	for(var i=0; i<aEle.length;i++)
	{
		if(aEle[i].className.search(re)!=-1)
		{
			aResult.push(aEle[i]);
		}
	}
	return aResult;
}
function $(id)
{
	return document.getElementById(id);
}
//startMove(oDiv, {width: 200, height: 200});

function startMove(obj, json, fnEnd)
{
	var attr;
	aMove.remove(obj);
	aMove.push(obj);
	obj.ff=function (){
		
		var bStop=true;		//是不是都到了，假设所有的都到了
		
		for(attr in json)
		{
			var iCur=0;
			
			//取当前位置
			if(attr=='opacity')
			{
				iCur=Math.round(parseFloat(getStyle(obj, attr))*100);
			}
			else
			{
				iCur=parseInt(getStyle(obj, attr));
			}
			
			//算速度
			var iSpeed=(json[attr]-iCur)/8;
			iSpeed=iSpeed>0?Math.ceil(iSpeed):Math.floor(iSpeed);
			
			//到没到
			
			if(attr=='opacity')
			{
				obj.style.filter='alpha(opacity:'+(iCur+iSpeed)+')';
				obj.style.opacity=(iCur+iSpeed)/100;
			}
			else
			{
				obj.style[attr]=iCur+iSpeed+'px';
			}
			
			if(iCur!=json[attr])
			{
				bStop=false;
			}
		}
		
		if(bStop)
		{
			aMove.remove(obj);
			if(fnEnd)
			{
				fnEnd(obj);
			}
		}
		//alert(obj.offsetHeight);
	}
}