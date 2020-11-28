## 安装docker

[Install Docker Engine on Ubuntu -- 官网](https://docs.docker.com/engine/install/ubuntu/)

这里面有很多细节，但是一个一个查比较耽搁时间，粗糙点吧。



## 部署Nginx

```shell
# 搜索要安装的包
sudo docker search Nginx

# 拉取镜像，虽然我配置了镜像加速但还是很慢
# 遇到超时报错。让自动执行10次，我去睡觉
sudo docker pull nginx
for i in {1..10}; do proxychains4 sudo docker pull nginx; done

# 查看镜像
sudo docker image ls

# 启动容器
sudo docker run -d -p 5000:80 --name nginx01 nginx

# 进入容器

# 不关闭退出容器

# 删除容器

```

