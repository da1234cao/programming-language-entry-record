function startMove(obj,property,target){
    /**
    * 将对象(obj)的属性(property),修改成指定值(target)
    */
    target = parseFloat(target);

    //透明度属性设置
    if(property == 'opacity'){
        var opacity = parseFloat(getComputedStyle(obj,null).opacity);
        var speed = 0.1;
        if(target < opacity)
            speed = -speed;
        
        clearInterval(obj.timer);
        obj.timer = setInterval(function() {
            //浮点数不好比较，都将其转换成整数
            // if(parseInt(opacity*10) == parseInt(target*10))
            if(Math.abs(opacity - target) < Math.abs(speed)){
                clearInterval(timer);
                obj.style.opacity = target;
            }else{
                opacity = opacity + speed;
                obj.style.opacity = opacity;
            }
        }, 30);
    }

    //非透明度属性设置
    if(property != 'opacity'){
        var step_speed = 8;
        clearInterval(obj.timer);
        obj.timer = setInterval(function(){
            var speed = (target - parseFloat(getComputedStyle(obj,null)[property]))/step_speed;
            speed = speed>0? Math.ceil(speed):Math.floor(speed);
            if(speed == 0){
                clearInterval(obj.timer);
            }else{
                obj.style[property] = parseFloat(getComputedStyle(obj,null)[property]) + speed + 'px';
            }
        },30)
    }
    
}