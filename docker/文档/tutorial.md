[toc]

## 安装docker

[Install Docker Engine on Ubuntu -- 官网](https://docs.docker.com/engine/install/ubuntu/)

这里面有很多细节，但是一个一个查比较耽搁时间，粗糙点吧。



## 部署Nginx

```shell
# 搜索要安装的包
$ sudo docker search nginx

# 拉取镜像，虽然我配置了镜像加速但还是很慢
# 遇到超时报错。让自动执行10次，我去睡觉
# 早上起来，发现镜像拉去完毕，但是sudo时效过去，得重新输入密码
$ sudo docker pull nginx
$ for i in {1..10}; do proxychains4 sudo docker pull nginx; done

# 查看镜像
$ sudo docker image ls

# 启动容器
$ sudo docker run -d -p 5000:80 --name nginx01 nginx
6fa6615d3697d20a557ce974fd27c48a315afa015eba27a4b2dab757b2beaf7a

# 进入容器
$ sudo docker exec -it 6fa6615d3697 /bin/bash

# 不关闭退出容器
Ctrl+P+Q

# 查看当前有哪些容器
# $ sudo docker ps
$ sudo docker container ls		

# 关闭容器
sudo docker container stop 6fa6615d3697

# 删除容器
sudo docker container rm 6fa6615d3697
sudo  docker container prune
```



## 部署ES+Kibana -- 待

Elasticsearch的docker hub地址：https://hub.docker.com/_/elasticsearch

```shell
$ proxychains4 sudo docker pull elasticsearch:7.9.3

# 启动会比较占用内存，得加内存限制
```



## Portainer可视化面板安装 -- 待

```shell
# 拉去镜像
$ docker pull portainer/portainer

# 不知道参数意思，先敲者
$ docker run -d -p 9000:9000 --restart=always -v /var/run/docker.sock:/var/run/docker.sock --privileged=true portainer/portainer
```



## commit镜像

```shell
# 拉去个tomcat镜像
$ sudo docker pull tomcat

# 启动容器
$ sudo docker run -d -p 8080:8080 --name tomcat01 tomcat
518df7d8d68b6271d243bcc915e5b82ea9a84ee743eade9fd71659c76c5c614f

# 进入容器
$  sudo docker exec -it 518df /bin/bash

# 修改容器的文件，也就是改动了容器的存储层。 我们可以通过 docker diff 命令看到具体的改动
$ cp -r webapps.dist/* webapps/

# 构建新的镜像
# docker commit [选项] <容器ID或容器名> [<仓库名>[:<标签>]]
$ sudo docker commit --author "dacao" --message "修改默认主页" tomcat01 tomcat01:1.0
```

