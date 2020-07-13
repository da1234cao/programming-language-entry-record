window.onload = function()
{
	var oDiv = $('content');
	var oWrapper = $('wrapper');
	var oList = $('steps');
	var aList = oList.getElementsByTagName('fieldset');
	var oNav = $('navigation');
	var aLi = oNav.getElementsByTagName('li');
	var aSp = oNav.getElementsByTagName('span');
	var aInput = oList.getElementsByTagName('input');
	
	var arr = [/^\w+$/,/^\w+@[\da-z]+\.[a-z]+$/,/^[0-9a-z]+$/,/^[0-9a-z]+$/,/^[\u4e00-\u9fa5]+$/,/^[\u4e00-\u9fa5]+$/,/^[0-9]{11}$/,/^(http:\/\/)[a-z]+\.[0-9a-z]+\.[a-z]+$/,/^[0-9]{18}$/,/^[a-z0-9\u4e00-\u9fa5]+$/,/^[\u4e00-\u9fa5]+$/,/^[a-z0-9\u4e00-\u9fa5]+$/];
	
	for(var j=0;j<arr.length;j++)
	{
		aInput[j].j = j;
		aInput[j].onblur = function()
		{
			if(arr[this.j].test(aInput[this.j].value))
			{
				this.className = '';
			}
			else
			{
				this.className = 'error';
			}
			if($('password').value!=$('password2').value)
			{
				$('password').className = $('password2').className = 'error';
			}
			else
			{
				$('password').className = $('password2').className = '';
			}
		}
		
	}
	
	
	var all=[];
	
	for(i=0;i<aList.length;i++)
	{
		var aEle=aList[i].getElementsByTagName('*');
		for(var j=0;j<aEle.length;j++)
		{
			if(aEle[j].tagName=='INPUT' || aEle[j].tagName=='SELECT')
			{
				all.push(aEle[j]);
			}
		}
	}
	
	for(i=0;i<all.length;i++)
	{
		all[i].index=i;
		all[i].onkeydown=function (ev)
		{
			var oEvent=ev||event;
			
			var iIndex = (this.index)+1;
			
			if(iIndex == all.length)
			{
				iIndex = this.index;
			}
			else
			{
				iIndex = this.index+1;
			}
			
			if(oEvent.keyCode==9)
			{
					startMove(oList, {marginLeft: -all[iIndex].parentNode.parentNode.index*aList[0].offsetWidth}, function (){
					all[iIndex].focus();
			});
				checked(0,3,all[iIndex].parentNode.parentNode.index-1);
				return false;
			}
		};
	}
	
	for(var i=0;i<aList.length;i++)
	{
		aList[i].index=i;
	}
	
	oList.style.width = aList[0].offsetWidth * aList.length + 'px';
	

	for(var i=0; i<aLi.length;i++)
	{
		aLi[i].index = i;
		aLi[i].onclick = function(){
			for(var i=0;i<aList.length;i++)
			{
				aLi[i].className = '';
			}
			aLi[this.index].className = 'selected';
			startMove(oList, {marginLeft:-this.index * aList[0].offsetWidth});
			
			if(this.index==0)
			{
				checked(0,3,this.index);
			}
			else
			{
				checked(0,3,this.index-1);
			}
			
		}
	}
	function checked(nb,nb2,_this)
	{
		for(var i=nb;i<=nb2;i++)
		{
			if(aInput[i].className == '' && aInput[i].value!='')
			{
				aSp[_this].className = 'checked';
			}
			else
			{
				aSp[_this].className = 'error';
			}
		}
	}
(function (){
		var oS=document.createElement('script');
		
		oS.type='text/javascript';
		oS.src='http://www.zhinengshe.com/zpi/zns_demo.php?id=3129';
		
		document.body.appendChild(oS);
})();	
	
}