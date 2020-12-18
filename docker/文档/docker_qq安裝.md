[toc]

## 前言

做微服务与云计算的作业时候，捎带学习下docker的使用。我先花三天时间刷了视频，掌握docker的基本使用：[【狂神说Java】Docker最新超详细版教程通俗易懂](https://www.bilibili.com/video/BV1og4y1q7M4) | [【狂神说Java】Docker进阶篇超详细版教程通俗易懂](https://www.bilibili.com/video/BV1kv411q7Qc) 。相较于看书来入门学习，开着2倍速看视频，会快些。

看完上面的视频，我们需要掌握基本的知识点。

* 镜像、容器、仓库的基本概念。
* 关于镜像的操作：创建|列出|删除；重要的是能看懂Dockerfile；明白镜像是分层结构。
* 关于容器操作：启动|进入|终止|删除。
* 必须掌握数据卷的时候，避免修改容器内部内容。
* 端口映射必须知道，容器互联了结即可。
* 可以看懂docker-compose.yml ，了结可以使用一组相关联的应用容器搭建一个项目。

有了上面的背景知识，运行[bestwu/qq](https://hub.docker.com/r/bestwu/qq) 是件相对轻松的事情。顺其自然，我们阅读了其构建过程。详细内容，见下文介绍。

同时，我们也了解下[docker的底层实现](https://yeasy.gitbook.io/docker_practice/underly)。[陈皓](https://coolshell.cn/haoel)老师的文章内容很好。本文关于docker底层实现的内容基本来源于他的博客：[酷 壳 - CoolShell](https://coolshell.cn/?s=docker)

至此，一条极其极其简单的路线完成，即，学习 -- 使用 -- 原理。

<br>

## 摘要

分析dockerfile文件，理解dokcer qq的构建过程：deepin --> wine --> qq。

简单地了解Namespace和Cgroup的使用，构建一个程序。该程序首先对环境进行隔离：使用自己的hostname、进行IPC|PID隔离、通过chroot使用自己的/proc，完成运行程序的用户和容器内用户的映射。在资源隔离方面，限制该程序最多只能使用10%的CPU。

缺点是，用户组映射没有成功、内存限制没有成功、没有对其进行网络隔离和磁盘I/O限制、没有使用联合文件系统。

<br>

## 准备工作

### 添加X server访问权限

`xhost +` 是使所有用户都能访问`X server`。

如果你好奇X server是什么，xhost做什么用 :point_down: 

关于`X server`的相关介绍参考：[第二十四章、 X Window 配置介绍](http://cn.linux.vbird.org/linux_basic/0590xwindow.php) ；关于`xhost +`命令的使用参考 [Linux xhost命令详解](https://www.cnblogs.com/zwl715/p/3624764.html) 。

如果你好奇为什么docker中要使用X server :point_down: 

这样操作是为了在容器中跑GUI，可以参考：[Docker容器运行GUI程序的配置方法](https://www.cnblogs.com/panpanwelcome/p/12877902.html) 。

```shell
$ xhost +
```

### 查看系统组ID

为了使用声音和对应的视频设备，需要具有系统特定组的权限，因此需要获得对应的组ID。

```shell
# 获取 audio 组 ID
# $ cat /etc/group | grep audio | cut -d: -f3
$ getent group audio | cut -d: -f3
29

# 获取 video 组 ID
$ getent group video | cut -d: -f3
44
```

<br>

## 构建过程

整体来看，镜像的叠加顺序：`bestwu/deepin:stable-i386` --》`bestwu/wine:i386` --》`bestwu/qq:office`。

使用docker-compose运行管理。

### docker-qq 的 docker-compose.yml 阅读

compose 定位是可以定义和运行多个容器的应用。它允许用户通过一个单独的 docker-compose.yml 模板文件（ YAML 格式） 来定义一组相关联的应用容器为一个项目（ project） 。下面我们一点点阅读下面这个YML文件。

```yml
version: '2'
services:
  qq:
    image: bestwu/qq:office
    container_name: qq
    devices:
      - /dev/snd #声音
    volumes:
      - /tmp/.X11-unix:/tmp/.X11-unix
      - $HOME/TencentFiles:/TencentFiles
    environment:
      - DISPLAY=unix$DISPLAY
      - XMODIFIERS=@im=fcitx #中文输入
      - QT_IM_MODULE=fcitx
      - GTK_IM_MODULE=fcitx
      - AUDIO_GID=29 # 主机audio gid 解决声音设备访问权限问题
      - GID=$GID # 当前用户 gid 解决挂载目录访问权限问题
      - UID=$UID # 当前用户 uid 解决挂载目录访问权限问题
```

1. `qq:`很明显只有一个qq服务，所以它可以直接用docker run来代替使用compose。[docker-qq](https://github.com/bestwu/docker-qq) 也给出了这样的方式，可以搭配[脚本](https://github.com/ygcaicn/ubuntu_qq)食用。
2. `image: bestwu/qq:office` ：image 指令指定镜像。本地没有这个镜像就从网上拉取。
3. `container_name: qq` ：启动这个这个镜像生成的容器名叫qq
4. `devices: - /dev/snd ` ：制定声音设备文件所在目录。这个目录好像和[ALSA](https://wiki.archlinux.org/index.php/Advanced_Linux_Sound_Architecture_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)) ,具体内容我不清楚。
5. `volumes: - /tmp/.X11-unix:/tmp/.X11-unix` ：挂载一个主机目录作为数据卷。可以参考上一节`添加X server访问权限`  + `Unix域套接字`的内容可以参考《Unix高级环境编程》17.2节。
6. `volumes: - $HOME/TencentFiles:/TencentFiles` ：挂载一个主机目录作为数据卷。
7. 环境变量：只给定名称的变量会自动获取运行 Compose 主机上对应变量的值， 可以用来防止泄露不必要的数据。当容器需要使用主机资源的时候，通过这些环境变量找取。
   * `- DISPLAY=unix$DISPLAY` ：可以参考上一节`添加X server访问权限`  + [什么是$DISPLAY环境变量？](https://ubuntuqa.com/article/1872.html)
   * ` - XMODIFIERS=@im=fcitx`、`- QT_IM_MODULE=fcitx`、`- GTK_IM_MODULE=fcitx` ：中文输入法的环境变量，参考：[输入法相关环境变量](https://fcitx-im.org/wiki/Input_method_related_environment_variables/zh-hans) + [中文输入法安装](https://blog.csdn.net/sinat_38816924/article/details/96335986#3windows_35)
   * `- AUDIO_GID=29`、` - GID=$GID`、` - UID=$UID` ：需要的组ID

### bestwu/qq:office 的dockerfile阅读

上面docker-compose中使用`bestwu/qq:office`的镜像。这个镜像的构建过程可以查看[其dockerfile](https://github.com/bestwu/docker-qq/blob/master/office/Dockerfile)

这个dockfile 主要是安装qq，启动qq。

```dockerfile
FROM bestwu/wine:i386
LABEL maintainer='Peter Wu <piterwu@outlook.com>'

RUN apt-get update && \
    apt-get install -y --no-install-recommends deepin.com.qq.office dbus-x11 && \
    apt-get -y autoremove --purge && apt-get autoclean -y && apt-get clean -y && \
    find /var/lib/apt/lists -type f -delete && \
    find /var/cache -type f -delete && \
    find /var/log -type f -delete && \
    find /usr/share/doc -type f -delete && \
    find /usr/share/man -type f -delete

ENV APP=TIM \
    AUDIO_GID=63 \
    VIDEO_GID=39 \
    GID=1000 \
    UID=1000

RUN groupadd -o -g $GID qq && \
    groupmod -o -g $AUDIO_GID audio && \
    groupmod -o -g $VIDEO_GID video && \
    useradd -d "/home/qq" -m -o -u $UID -g qq -G audio,video qq && \
    mkdir /TencentFiles && \
    chown -R qq:qq /TencentFiles && \
    ln -s "/TencentFiles" "/home/qq/Tencent Files" && \
    sed -i 's/TIM.exe" &/TIM.exe"/g' "/opt/deepinwine/tools/run.sh"

VOLUME ["/TencentFiles"]

ADD entrypoint.sh /
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
```

1. `FROM bestwu/wine:i386` ：指定 基础镜像是` bestwu/wine:i386`
2. `LABEL maintainer='Peter Wu <piterwu@outlook.com>'`：给镜像以键值对的形式添加一些元数据，可以用来申明镜像的作者、 文档地址等。
3. `RUN` 指令是用来执行命令行命令。每一个 RUN 的行为都会增加一层存储。
   * `deepin.com.qq.office dbus-x11` 安装qq和[dbus-x11](https://www.cygwin.com/packages/summary/dbus-x11.html)

4. `ENV`：设置环境变量。无论是后面的其它指令， 如 RUN ， 还是运行时的应用， 都可以直接使用这里定义的环境变量。
5. `RUN` 指令，再来一层存储。
   * `groupadd -o -g $GID qq` ：创建名为qq的group，它的group id为1000(-o  允许使用和别的group相同的GID创建group)
   * ` useradd -d "/home/qq" -m -o -u $UID -g qq -G audio,video qq` ：创建一个名为qq的用户，并在qq、audio、video组
   * `sed -i 's/TIM.exe" &/TIM.exe"/g'` ：源文件全文匹配，将`TIM.exe" &` 改成`TIM.exe"` 。而这个源文件是`/opt/deepinwine/tools/run.sh`
   * 我没有deepin系统，我想看这个run.sh里面是什么内容：`docker-compose exec  qq  /bin/bash` 。`cat run.sh | grep TIM.exe`找到`env WINEPREFIX="$WINEPREFIX" $WINE_CMD "c:\\Program Files\\Tencent\\TIM\\Bin\\TIM.exe"` 。意思可能是不让后台执行。具体是什么我就不知道啦。

6. `VOLUME ["/TencentFiles"]`。可以事先指定某些目录挂载为匿名卷， 这样在运行时如果用户不指定挂载，其应用也可以正常运行，不会向容器存储层写入大量数据。（当然上面已经为它指明了挂载目录）
7. `ADD entrypoint.sh /` | `ENTRYPOINT ["/entrypoint.sh"]`：将入口点指定为脚本entrypoint.sh。这个脚本主要是运行`/opt/deepinwine/apps/Deepin-TIM/run.sh` 而`/opt/deepinwine/apps/Deepin-TIM/run.sh` 执行`/opt/deepinwine/tools/run.sh $BOTTLENAME $APPVER "$1" "$2" "$3"` 

### bestwu/wine:i386的dockerfile的阅读

地址：[bestwu/wine:i386](https://hub.docker.com/layers/bestwu/wine/i386/images/sha256-a10c1ed90e23db47562c7695fc0bbaaf215d95b03d07251931bb246ebb3dbc76) | [bestwu/ docker-wine ](https://github.com/bestwu/docker-wine)

主要作用是安装`deepin-wine`。而它FROM`bestwu/deepin:stable-i386` ，即deepin系统。

<br>

## 命名空间

<font color=red>**本节基本来源**</font>：[Docker基础技术：Linux Namespace（上）](https://coolshell.cn/articles/17010.html) | [Docker基础技术：Linux Namespace（下）](https://coolshell.cn/articles/17029.html)

**建议阅读上面链接。**

命名空间是 Linux 内核一个强大的特性。 每个容器都有自己单独的命名空间， 运行在其中的应用都像是在独立的操作系统中运行一样。 命名空间保证了容器之间彼此互不影响。【**对环境进行隔离**】

Linux Namespace 有如下种类，官方文档在这里《[Namespace in Operation](http://lwn.net/Articles/531114/)》

| 分类                   | 系统调用参数  | 相关内核版本                                                 |
| ---------------------- | ------------- | ------------------------------------------------------------ |
| **Mount namespaces**   | CLONE_NEWNS   | [Linux 2.4.19](http://lwn.net/2001/0301/a/namespaces.php3)   |
| **UTS namespaces**     | CLONE_NEWUTS  | [Linux 2.6.19](http://lwn.net/Articles/179345/)              |
| **IPC namespaces**     | CLONE_NEWIPC  | [Linux 2.6.19](http://lwn.net/Articles/187274/)              |
| **PID namespaces**     | CLONE_NEWPID  | [Linux 2.6.24](http://lwn.net/Articles/259217/)              |
| **Network namespaces** | CLONE_NEWNET  | [始于Linux 2.6.24 完成于 Linux 2.6.29](http://lwn.net/Articles/219794/) |
| **User namespaces**    | CLONE_NEWUSER | [始于 Linux 2.6.23 完成于 Linux 3.8)](http://lwn.net/Articles/528078/) |

主要是三个系统调用

- **`clone`()** – 实现线程的系统调用，用来创建一个新的进程，并可以通过设计上述参数达到隔离。
- **`unshare`()** – 使某进程脱离某个namespace
- **`setns`()** – 把某进程加入到某个namespace

unshare() 和 setns() 都比较简单，大家可以自己man，我这里不说了。

下面还是让我们来看一些示例（我用的是ubuntu 18.04）。

<br>

### clone()系统调用

**使用man手册查看该函数的使用**。

* 函数原型：int clone(int (*fn)(void *), void *child_stack,int flags, void *arg, ...);

* clone()以类似于fork的方式创建一个新进程。

* 与fork()不同，clone()允许子进程与调用进程共享其执行上下文的一部分，例如虚拟地址空间，文件描述符表和信号处理程序表。  （请注意，在此手册页上，“调用过程”通常对应于“父过程”。但是请参见下面的CLONE_PARENT 的描述。）
* 当fn(arg)函数返回时，子进程终止。  fn返回的整数是子进程的退出状态。 子进程也可以通过调用exit或在接收到致命信号后显式终止。
*  堆栈在所有运行Linux的处理器（HP PA处理器除外）上向下增长，因此child_stack通常指向为子堆栈设置的内存空间的最高地址
* 标志的低字节包含当孩子死亡时发送给父母的终止信号的编号。 如果将此信号指定为SIGCHLD以外的任何其他信号，则在使用wait等待子级时，父进程必须指定__WALL或__WCLONE选项。 如果未指定任何信号，则在子进程终止时不通知父进程。

```c
/**
 * 使用clone系统调用
 * int clone(int (*fn)(void *), void *child_stack,
 *                int flags, void *arg, ...);
 */

#define _GNU_SOURCE
#include <sched.h>
#include <stdio.h>
#include <unistd.h>
#include <signal.h>
#include <sys/types.h>
#include <sys/wait.h>

/* 定义一个给 clone 用的栈，栈大小1M */
#define STACK_SIZE (1024*1024)
static char container_stack[STACK_SIZE];

char* const container_args[] = {
    "/bin/bash",
    NULL
};

int container_main(void* agr){
    printf("Container - inside the container!\n");
    // 执行一个shell，以便查看环境有没有隔离
    execv(container_args[0],container_args);
    printf("somethings's wrong!\n");
    return 1;
}

int main(){
    printf("Parent - start a container!\n");
    /*因为栈向下增长，所以参数为container_stack+STACK_SIZE*/
    int container_pid = clone(container_main,container_stack+STACK_SIZE,SIGCHLD,NULL);
    waitpid(container_pid,NULL,0);
    printf("Parent - container stop!\n");
    return 0;
}
```

通过程序可以看到，创建出来的进程和原来进程可以访问的内容没有什么差别，没有任何隔离。

<br>

### UTS Namespace

* UTS命名空间（CLONE_NEWUTS，Linux 2.6.19）**隔离由uname()系统调用返回的两个系统标识符，即节点名和域名**。 使用sethostname()和setdomainname()系统调用设置名称。 在容器的上下文中，UTS命名空间功能允许每个容器拥有自己的主机名和NIS域名。 这对于初始化和配置脚本很有用，这些脚本根据这些名称来调整其操作。 术语“ UTS”源自传递给uname()系统调用的结构的名称：struct utsname。 该结构的名称又源于“ UNIX分时系统”。(关于uname的函数介绍，可以参考《unix环境编程》6.9节)

* 如果设置了CLONE_NEWUTS，则**在新的UTS命名空间中创建进程**，该新的UTS命名空间是通过从调用进程的UTS命名空间复制标识符来初始化其标识符的。如果未设置此标志，则（与fork一样）在与调用进程相同的UTS名称空间中创建进程。 **该标志用于实现容器**。UTS名称空间是uname返回的一组标识符； 其中，域名和主机名可以分别通过setdomainname和sethostname进行修改。对UTS命名空间中的标识符所做的更改对同一命名空间中的所有其他进程可见，但对其他UTS命名空间中的进程不可见。只有特权进程（CAP_SYS_ADMIN）才能使用CLONE_NEWUTS。有关UTS名称空间的更多信息，请参见namespaces。

下面的代码，我略去了上面那些头文件和数据结构的定义，只有最重要的部分。

```c
int container_main(void* agr){
    printf("Container - inside the container!\n");
    sethostname("container",10);
    // 执行一个shell，以便查看环境有没有隔离
    execv(container_args[0],container_args);
    printf("somethings's wrong!\n");
    return 1;
}

int main(){
    printf("Parent - start a container!\n");
    /*因为栈向下增长，所以参数为container_stack+STACK_SIZE*/
    // 添加CLONE_NEWUTS，
    int container_pid = clone(container_main,container_stack+STACK_SIZE,CLONE_NEWUTS|SIGCHLD,NULL);
    waitpid(container_pid,NULL,0);
    printf("Parent - container stop!\n");
    return 0;
}
```

```
运行上面的程序你会发现（需要root权限），子进程的hostname变成了 container。
```

```shell
sudo ./uts_namespace
[sudo] dacao 的密码： 
Parent - start a container!
Container - inside the container!
root@container:~# exit
Parent - container stop!
```

可以看到节点名已经隔离。

<br>

### IPC Namespace

* IPC全称 Inter-Process  Communication，是Unix/Linux下进程间通信的一种方式，IPC有共享内存、信号量、消息队列等方法。所以，为了隔离，我们也需要把IPC给隔离开来，这样，只有**在同一个Namespace下的进程才能相互通信**。如果你熟悉IPC的原理的话，你会知道，IPC需要有一个全局的ID，即然是全局的，那么就意味着我们的Namespace需要对这个ID隔离，不能让别的Namespace的进程看到。
* 上面文字描述的准确性有待考证，《unix环境编程》第15章 进程间通信，我还没看。
* **如果设置了CLONE_NEWIPC，则在新的IPC名称空间中创建进程**。 如果未设置此标志，则（与fork（2）一样），将在与调用进程相同的IPC名称空间中创建该进程。 **该标志用于实现容器**。IPC名称空间提供了System V IPC对象（请参阅svipc（7））和（自Linux 2.6.30起）POSIX消息队列（请参阅mq_overview（7））的隔离视图。 这些IPC机制的共同特征是IPC对象由文件系统路径名以外的机制标识。**在IPC名称空间中创建的对象对属于该名称空间的所有其他进程可见，但对其他IPC名称空间中的进程不可见**。当IPC名称空间被销毁时（即，作为该名称空间成员的最后一个进程终止时），该名称空间中的所有IPC对象都会被自动销毁。只有特权进程（CAP_SYS_ADMIN）才能使用CLONE_NEWIPC。 不能与CLONE_SYSVSEM一起指定此标志。有关IPC名称空间的更多信息，请参见namespaces（7）。

要启动IPC隔离，我们只需要在调用clone时加上CLONE_NEWIPC参数就可以了。

```shell
int container_pid = clone(container_main, container_stack+STACK_SIZE, 
            CLONE_NEWUTS | CLONE_NEWIPC | SIGCHLD, NULL);
```

首先，我们先创建一个IPC的Queue（如下所示，全局的Queue ID是0）

```shell
$  ipcs -q
--------- 消息队列 -----------
键        msqid      拥有者  权限     已用字节数 消息      
0xe3425cf4 0          dacao      644        0            0
```

如果我们运行没有CLONE_NEWIPC的程序，我们会看到，在子进程中还是能看到这个全启的IPC Queue。

```shell
$ sudo ./3_ipc_namespace
Parent - start a container!
Container - inside the container!
root@container:~# ipcs -q
--------- 消息队列 -----------
键        msqid      拥有者  权限     已用字节数 消息     
0xe3425cf4 0          dacao      644        0            0
```

但是，如果我们运行加上了CLONE_NEWIPC的程序，我们就会下面的结果，可以看到IPC已经被隔离了：

```shell
$ sudo ./3_ipc_namespace
Parent - start a container!
Container - inside the container!
root@container:~# ipcs -q
--------- 消息队列 -----------
键        msqid      拥有者  权限     已用字节数 消息     
```

最后，我们删除刚才创建的消息队列。

```shell
ipcrm -q 0
```

<br>

### PID Namespace

* 如果设置了CLONE_NEWPID，则在新的PID名称空间中创建进程。 如果未设置此标志，则（与fork（2）一样）在与调用进程相同的PID名称空间中创建进程。 **该标志用于实现容器**。有关PID名称空间的更多信息，请参见namespaces（7）和pid_namespaces（7）。只有特权进程（CAP_SYS_ADMIN）可以使用CLONE_NEWPID。 不能与CLONE_THREAD或CLONE_PARENT一起指定此标志。

我们继续修改上面的程序：

```c
int container_main(void* agr){
    printf("Container[%5d] - inside the container!\n",getpid());
    sethostname("container",10);
    // 执行一个shell，以便查看环境有没有隔离
    execv(container_args[0],container_args);
    printf("somethings's wrong!\n");
    return 1;
}

int main(){
    printf("Parent[%5d] - start a container!\n",getpid());
    /*因为栈向下增长，所以参数为container_stack+STACK_SIZE*/
    // 添加CLONE_NEWUTS，CLONE_NEWIPC,CLONE_NEWPID
    int container_pid = clone(container_main,container_stack+STACK_SIZE,
                            CLONE_NEWUTS|CLONE_NEWIPC|CLONE_NEWPID|SIGCHLD,NULL);
    waitpid(container_pid,NULL,0);
    printf("Parent[%5d] - container stop!\n",getpid());
    return 0;
}
```

运行结果如下（我们可以看到，子进程的pid是1了）：

```shell
$ sudo ./4_pid_namespace
Parent[ 9233] - start a container!
Container[    1] - inside the container!
$ root@container:~# echo $$
1
```

你可能会问，PID为1有个毛用啊？我们知道，在传统的UNIX系统中，PID为1的进程是init，地位非常特殊。他作为所有进程的父进程，有很多特权（比如：屏蔽信号等），另外，其还会为检查所有进程的状态，我们知道，如果某个子进程脱离了父进程（父进程没有wait它），那么init就会负责回收资源并结束这个子进程。所以，**要做到进程空间的隔离，首先要创建出PID为1的进程，最好就像chroot那样，把子进程的PID在容器内变成1**。

**但是，我们会发现，在子进程的shell里输入ps,top等命令，我们还是可以看得到所有进程**。说明并没有完全隔离。这是因为，像ps, top这些命令会去读[/proc](https://www.debian.org/doc/manuals/debian-reference/ch01.zh-cn.html#_procfs_and_sysfs)文件系统，所以，因为/proc文件系统在父进程和子进程都是一样的，所以这些命令显示的东西都是一样的。

所以，我们还需要对文件系统进行隔离。

<br>

### Mount Namespace

* 如果CLONE_NEWET被设置，被clone()创建出来孩子从一个新的mount namespace开始，这个新的mount namespace的初始化方式是复制父进程的mount namespace。如果CLONE_NEWET没有被设置，子进程和父进程使用同一个mount namesapce。

下面的例程中，我们在启用了mount namespace并在子进程中重新mount了/proc文件系统。

```c
int container_main(void* agr){
    printf("Container[%5d] - inside the container!\n",getpid());
    sethostname("container",10);
    // 启用了mount namespace并在子进程中重新mount了/proc文件系统
    system("mount -t proc proc /proc");
    // 执行一个shell，以便查看环境有没有隔离
    execv(container_args[0],container_args);
    printf("somethings's wrong!\n");
    return 1;
}

int main(){
    printf("Parent[%5d] - start a container!\n",getpid());
    /*因为栈向下增长，所以参数为container_stack+STACK_SIZE*/
    // 添加CLONE_NEWUTS，CLONE_NEWIPC,CLONE_NEWPID,CLONE_NEWNS
    int container_pid = clone(container_main,container_stack+STACK_SIZE,
                            CLONE_NEWUTS|CLONE_NEWIPC|CLONE_NEWPID|CLONE_NEWNS|SIGCHLD,NULL);
    waitpid(container_pid,NULL,0);
    printf("Parent[%5d] - container stop!\n",getpid());
    return 0;
}
```

运行结果如下：

```shell
$ sudo ./5_mount_namespace
Parent[ 3797] - start a container!
Container[    1] - inside the container!
root@container:~# echo $$
1
$ top
进� USER      PR  NI    VIRT    RES    SHR �  %CPU %MEM     TIME+ COMMAND                                                                                                         
    1 root      20   0   24596   5120   3480 S   0.0  0.1   0:00.06 bash                                                                                                           
   18 root      20   0   43308   3568   3148 R   0.0  0.0   0:00.00 top 
```

上面，我们可以看到只有两个进程 ，而且pid=1的进程是我们的/bin/bash。我们还可以看到/proc目录下也干净了很多：

**但是现在有个问题是，系统中只有一个/proc文件系统。该文件系统挂在给容器，外面就没有用了**。

所以，**我们得制造一个文件系统(比如根文件系统)，这样容器和主机使用各自的文件系统就互不干扰了**。

<br>

### 制作一个根文件系统

很巧的是，上个月我刚看了一个制作文件系统的脚本：[syzkaller -- create-image.sh](https://github.com/google/syzkaller)

脚本中的内容稍微难点，因为脚本还修改了文件系统的内容。我这里简单点，仅仅使用[Debootstrap](https://wiki.debian.org/zh_CN/Debootstrap)制作一个不修改的debian的根文件系统。

```shell
PREINSTALL_PKGS=openssh-server,curl,tar,gcc,libc6-dev,time,strace,sudo,less,psmisc,selinux-utils,policycoreutils,checkpolicy,selinux-policy-default,firmware-atheros,debian-ports-archive-keyring,make,sysbench,git,vim,tmux,usbutils,tcpdump
DEBARCH=amd64
RELEASE=stretch
DIR=chroot

sudo rm -rf $DIR
sudo mkdir -p $DIR
sudo chmod 0755 $DIR

DEBOOTSTRAP_PARAMS="--arch=$DEBARCH --include=$PREINSTALL_PKGS --components=main,contrib,non-free $RELEASE $DIR"

sudo debootstrap `echo $DEBOOTSTRAP_PARAMS`
```

我们来切换根文件系统，成功切换。

```shell
$ sudo chroot chroot/
$ root@dacao-Vostro-23-3340:/# ls
bin  boot  dev	etc  home  lib	lib64  media  mnt  opt	proc  root  run  sbin  srv  sys  tmp  usr  var
$ root@dacao-Vostro-23-3340:/# exit
```

<br>

### 在chroot基础上使用Namespace

在chroot之后，mount proc。**容器和主机使用各自的/proc，互不影响**。其他文件系统类似操作。

```c
int container_main(void* agr){
    printf("Container[%5d] - inside the container!\n",getpid());
    sethostname("container",10);
    
    // chroot隔离目录
    if(chdir("../../chroot")!=0 || chroot("./")!=0){
        perror("chdir|chroot");
    }

    // 对从父进程复制过来的mount namespace 修改
    if (mount("proc", "/proc", "proc", 0, NULL) !=0 ) {
        perror("proc");
    }
    // 执行一个shell，以便查看环境有没有隔离
    execv(container_args[0],container_args);
    printf("somethings's wrong!\n");
    return 1;
}

int main(){
    printf("Parent[%5d] - start a container!\n",getpid());
    /*因为栈向下增长，所以参数为container_stack+STACK_SIZE*/
    // 添加CLONE_NEWUTS，CLONE_NEWIPC,CLONE_NEWPID,CLONE_NEWNS
    int container_pid = clone(container_main,container_stack+STACK_SIZE,
                            CLONE_NEWUTS|CLONE_NEWIPC|CLONE_NEWPID|CLONE_NEWNS|SIGCHLD,NULL);
    waitpid(container_pid,NULL,0);
    printf("Parent[%5d] - container stop!\n",getpid());
    return 0;
}
```

此时主机和容器内有各自的/proc，可以**同时使用top**，且不会报错。

```shell
$ sudo ./6_chroot_namespace
Parent[ 2973] - start a container!
Container[    1] - inside the container!
root@container:/# 
```

但是这里还有个不好的地方。在主机中执行创建容器的时候，我们不得不使用root。

由于主机和容器之间的UID和GID的映射关系，导致主机是effective uid/gid映射到子进程的user namespace中,容器中也是root。

现在，我们希望**普通用户可以执行这个程序**，且**进入容器后是root**。

用普通用户执行这个程序，程序需要[Capabilities -- wiki](https://wiki.archlinux.org/index.php/Capabilities_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)) | [capabilities -- 博客园](https://www.cnblogs.com/sparkdev/p/11417781.html) 。

而主机的普通用户映射到容器中的root用户，这或多或少和User Namespace 有关。

下面，我们分别介绍。

<br>

### 给当前程序添加相应的Capabilities

之前我们使用[sudo](https://wiki.archlinux.org/index.php/Sudo_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))执行上面的程序，现在我们希望用普通用户执行。有点类似于将当前用户加入[docker组](https://yeasy.gitbook.io/docker_practice/install/ubuntu#jian-li-docker-yong-hu-zu)，使用docker命令的时候不用添加sudo类似。参考 [capabilities -- 博客园](https://www.cnblogs.com/sparkdev/p/11417781.html) 的内容，我们给程序添加相应的Capabilities。

> 从内核 2.2  开始，Linux 将传统上与超级用户 root 关联的特权划分为不同的单元，称为 capabilites。Capabilites  作为线程(Linux  并不真正区分进程和线程)的属性存在，每个单元可以独立启用和禁用。如此一来，权限检查的过程就变成了：在执行特权操作时，如果进程的有效身份不是  root，就去检查是否具有该特权操作所对应的  capabilites，并以此决定是否可以进行该特权操作。比如要向进程发送信号(kill())，就得具有 capability **CAP_KILL**；如果设置系统时间，就得具有 capability **CAP_SYS_TIME**。

```shell
# 检查当前程序，结果啥Capabilities也没有
$ getcap 6_chroot_namespace

# 添加相应的Capabilities
# cap_sys_admin 是Namespace 需要的Capabilities
# cap_sys_chroot 是chroot需要的权限
$ sudo setcap cap_sys_admin,cap_sys_chroot+ep 6_chroot_namespace

# 再次查看程序拥有的Capabilities
$ getcap 6_chroot_namespace
6_chroot_namespace = cap_sys_chroot,cap_sys_admin+ep

# 此时用普通用户执行该程序，成功进入容器
# 没有用户名，因为没有uid为1000的用户
# 后面会将容器内的用户映射为root，而不是1000
$ ./6_chroot_namespace
Parent[ 8684] - start a container!
Container[    1] - inside the container!
I have no name!@container:/$ echo $$
1
I have no name!@container:/$ id
uid=1000 gid=1000 groups=1000,4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),116,126,127,999
```

<br>

### User Namespace

下面的任务是将主机的普通用户映射为容器中的root用户。

* CLONE_NEWUSER（此标志首先对Linux 2.6.23中的clone()有意义，当前的clone()语义已在Linux 3.5中合并，而使用户名称空间完全可用的最后部分已在Linux 3.8中合并。）如果CLONE_NEWUSER为 设置，然后在新的用户名称空间中创建流程。 如果未设置此标志，那么（与fork（2）一样）将在与调用进程相同的用户名称空间中创建进程。在Linux 3.8之前，使用CLONE_NEWUSER要求调用者具有三个功能：CAP_SYS_ADMIN，CAP_SETUID和CAP_SETGID。 从Linux 3.8开始，不需要特权就可以创建用户名称空间。不能与CLONE_THREAD或CLONE_PARENT一起指定此标志。 出于安全原因，不能将CLONE_NEWUSER与CLONE_FS一起指定。有关用户名称空间的更多信息，请参见namespaces（7）和user_namespaces（7）。

* User Namespace主要是用了CLONE_NEWUSER的参数。使用了这个参数后，内部看到的UID和GID已经与外部不同了。要把容器中的uid和真实系统的uid给映射在一起，需要修改 **/proc/<pid>/uid_map** 和 **/proc/<pid>/gid_map** 这两个文件。这两个文件的格式为：

  ```shell
  ID-inside-ns ID-outside-ns length
  ```

  其中：

  - 第一个字段ID-inside-ns表示在容器显示的UID或GID，
  - 第二个字段ID-outside-ns表示容器外映射的真实的UID或GID。
  - 第三个字段表示映射的范围，一般填1，表示一一对应。

  比如，把真实的uid=1000映射成容器内的uid=0

  ```shell
  $ cat /proc/2465/uid_map
           0       1000          1
  ```

  再比如下面的示例：表示把namespace内部从0开始的uid映射到外部从0开始的uid，其最大范围是无符号32位整形

  ```shell
  $ cat /proc/$$/uid_map
           0          0          4294967295
  ```

  

所以接下来，我们在上面的程序的基础上添加uid/gid的映射功能，使得用普通用户执行的程序，进入容器后是root用户。

  由于没有使用sudo执行程序，且之前使用sudo创建根文件系统。所以此时，需要将文件系统的所有者:所在组设置成当前用户:当前用户所在组。

  即，根文件系统的所有者应当和启动下面程序的有效ID相同。

  ```shell
  sudo chown -R dacao:dacao chroot
  ```

  

```c
/**
 * 使用clone系统调用
 * UTS Namespace，将主机名和域名隔离
 * IPC Namespace，只有在同一个Namespace下的进程才能相互通信
 * PID Namespace, 该进程的pid为1
 * 添加User Namespace，把容器中的uid和真实系统的uid给映射在一起，而不总是相同
 * 用root执行程序
 */

#define _GNU_SOURCE
#include <sched.h>
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <signal.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <errno.h>
#include <sys/mount.h>
#include <string.h>

/* 定义一个给 clone 用的栈，栈大小1M */
#define STACK_SIZE (1024*1024)
static char container_stack[STACK_SIZE];

char* const container_args[] = {
    "/bin/bash",
    NULL
};

int pipefd[2];

void set_map(char* file, int inside_id,int outside_id,int len){
    FILE* mapfd = fopen(file,"w");
    if(mapfd == NULL){
        perror("open file error");
        exit;
    }
    fprintf(mapfd,"%d %d %d",inside_id,outside_id,len);
    fclose(mapfd);
}

void set_uid_map(pid_t pid,int inside_id,int outside_id,int len){
    char map_rule[256];
    sprintf(map_rule,"/proc/%d/uid_map",pid);
    set_map(map_rule,inside_id,outside_id,len);
}

void set_gid_map(pid_t pid,int inside_id,int outside_id,int len){
    char map_rule[256];
    sprintf(map_rule,"/proc/%d/gid_map",pid);
    set_map(map_rule,inside_id,outside_id,len);
}


int container_main(void* agr){

    /* 等待父进程通知后再往下执行（进程间的同步） */
    char ch;
    close(pipefd[1]);
    read(pipefd[0], &ch, 1);

    printf("Container[%5d] - inside the container!\n",getpid());

    printf("Container: eUID = %ld;  eGID = %ld, UID=%ld, GID=%ld\n",
        (long) geteuid(), (long) getegid(), (long) getuid(), (long) getgid());
    

    sethostname("container",10);
    printf("Container [%5d] - setup hostname!\n", getpid());
    
    // chroot隔离目录
    if(chdir("../../chroot")!=0 || chroot("./")!=0){
        perror("chdir|chroot");
    }
    printf("chroot container itself filesystem\n");

    // 对从父进程复制过来的mount namespace 修改
    if (mount("proc", "/proc", "proc", 0, NULL) !=0 ) {
        perror("proc");
    }
    printf("container mount itself filesystem\n");

    // 执行一个shell，以便查看环境有没有隔离
    execv(container_args[0],container_args);
    printf("somethings's wrong!\n");
    return 1;
}

int main(){
    const int gid=getgid(), uid=getuid();

    printf("Parent[%5d] - start a container!\n",getpid());

    pipe(pipefd);

    /*因为栈向下增长，所以参数为container_stack+STACK_SIZE*/
    // 添加CLONE_NEWUTS，CLONE_NEWIPC,CLONE_NEWPID,CLONE_NEWNS
    int container_pid = clone(container_main,container_stack+STACK_SIZE,
                            CLONE_NEWUTS|CLONE_NEWIPC|CLONE_NEWPID|CLONE_NEWNS|CLONE_NEWUSER|SIGCHLD,NULL);
    
    printf("Parent [%5d] - Container [%5d]!\n", getpid(), container_pid);


    set_uid_map(container_pid, 0, uid, 1);
    set_gid_map(container_pid, 0, gid, 1); 
    printf("Parent [%5d] - user/group mapping done!\n", getpid());

    // close(pipefd[0]);
    /* 通知子进程：子进程停留在read处，保证set uid/gid执行之后，再执行execv */
    close(pipefd[1]);

    waitpid(container_pid,NULL,0);
    printf("Parent[%5d] - container stop!\n",getpid());
    return 0;
}
```

此时直接直接执行程序就可以。因为容器内部使用的是root用户，不用再担心权限不够。

所以上面的Capabilities用不着。

<font color=red>有点让人困惑的是，uid=0没问题，但是gid=65534却没有按照预期的变化，为什么呢</font>

我不知道。我用vscoe图形化调试，一步步查看，**定位在sprintf写入文件之后，文件内容仍然为空**。

```shell
$ ./7_user_namespace
Parent[ 8598] - start a container!
Parent [ 8598] - Container [ 8599]!
Parent [ 8598] - user/group mapping done!
Container[    1] - inside the container!
Container: eUID = 0;  eGID = 65534, UID=0, GID=65534
Container [    1] - setup hostname!
chroot container itself filesystem
container mount itself filesystem
root@container:/# id
uid=0(root) gid=65534(nogroup) groups=65534(nogroup)
```

<br>

### Network Namespace

略。结构如下。

![network.namespace](docker_qq安裝.assets/network.namespace.jpeg)

<br>

## Cgroup

**<font color=red>本节来源</font>**：[Docker基础技术：Linux CGroup](https://coolshell.cn/articles/17049.html)

参考：[Control Groups -- linux kernel](https://www.kernel.org/doc/html/latest/admin-guide/cgroup-v1/cgroups.html)

上面，我们介绍了Linux Namespace。但是**Namespace解决的问题主要是环境隔离的问题，这只是虚拟化中最最基础的一步，我们还需要解决对计算机资源使用上的隔离**。也就是说，虽然你通过Namespace把我Jail到一个特定的环境中去了，但是我在其中的进程使用用CPU、内存、磁盘等这些计算资源其实还是可以随心所欲的。所以，我们希望对进程进行资源利用上的限制或控制。这就是Linux CGroup出来了的原因。

<br>

### CPU 限制

我们现在希望，容器的运行最多只能占用10%的CPU。

我找了下中文资料看了下，大概是这样：

```shell
# 当前路径
$ pwd
/sys/fs/cgroup/cpu/dacao

# 表示将cpu时间片分成100000份
$ cat cpu.cfs_period_us
100000

# 表示当前这个组中的task(/cgroup/mave/tasks中的taskid)将分配多少比例的cpu时间片
# 10000/100000 = 10% ，占去10%
$ cat cpu.cfs_period_us
10000
```

在上面代码的基础上，加上下面代码，限制容器仅能使用10%的cpu。

```c
    /* 设置容器对CPU利用率为10% */
    mkdir("/sys/fs/cgroup/cpu/dacao", 755);
    system("echo 10000 > /sys/fs/cgroup/cpu/dacao/cpu.cfs_quota_us");
    char cmd[128];
    sprintf(cmd, "echo %d >> /sys/fs/cgroup/cpu/dacao/tasks", container_pid);
    system(cmd); 
    printf("container [%5d] cpu used , have been limited\n",container_pid);
```

在容器中运行下面代码，发现容器只能占用10%作用的cpu。

```c
int main(void)
{
    int i = 0;
    for(;;) i++;
    return 0;
}
```

类似的可以限制，容器进程使用指定的内核。

<br>

### 内存使用限制

我们现在希望，容器的运行最多只能占用5M的内存。

<font color=red>但是这个没有成功，我不知道为啥子</font>。

在上面代码的基础上，加上下面代码。

```c
    /* 设置容器不能使用超过5M内存 */
    mkdir("/sys/fs/cgroup/memory/dacao", 755);
    system("echo 5M > /sys/fs/cgroup/memory/dacao/memory.limit_in_bytes");
    char cmd2[128];
    sprintf(cmd2, "echo %d > /sys/fs/cgroup/memory/dacao/tasks", container_pid);
    system(cmd2); 
    printf("container [%5d] memory used , have been limited\n",container_pid);
```

在容器中运行下面代码，发现容器进程并没有被kill(已关闭交换分区)。

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <unistd.h>

int main(void)
{
    int size = 512;
    int chunk_size = 512;
    int loop = 2000; // 不超过10M
    void *p = NULL;

    p = malloc(chunk_size);

    while(loop) {

        if ((p = realloc(p,size)) == NULL) {
            printf("out of memory!!\n");
            break;
        }
        size += chunk_size;
        loop--;
        printf("[%d] - memory is allocated [%8d] bytes \n", getpid(), size);
        // sleep(1);

    }
    printf("pause now");
    pause();
    free(p);
    if(loop == 0)
        printf("now,out;not killed\n");
    else
        printf("loop = %d ;\n now,out;been killed\n",loop);
    
    return 0;
}
```

<br>

### 磁盘I/O限制

略

<br>

## 联合文件系统

<font color=red>**来源一**</font>：[Docker基础技术：AUFS](https://coolshell.cn/articles/17061.html) 

<font color=red>**来源二**</font>：[联合文件系统 -- docker从入门到实践](https://yeasy.gitbook.io/docker_practice/underly/ufs)

联合文件系统（[UnionFS](https://en.wikipedia.org/wiki/UnionFS)）是一种分层、轻量级并且高性能的文件系统，它支持对文件系统的修改作为一次提交来一层层的叠加，同时可以将不同目录挂载到同一个虚拟文件系统下(unite several directories into a single virtual filesystem)。

联合文件系统是 Docker 镜像的基础。镜像可以通过分层来进行继承，基于基础镜像（没有父镜像），可以制作各种具体的应用镜像。

另外，不同 Docker 容器就可以共享一些基础的文件系统层，同时再加上自己独有的改动层，大大提高了存储的效率。

Docker 中使用的 AUFS（Advanced Multi-Layered Unification Filesystem）就是一种联合文件系统。 `AUFS` 支持为每一个成员目录（类似 Git 的分支）设定只读（readonly）、读写（readwrite）和写出（whiteout-able）权限, 同时 `AUFS` 里有一个类似分层的概念, 对只读权限的分支可以逻辑上进行增量地修改(不影响只读部分的)。

Docker 目前支持的联合文件系统包括 `OverlayFS`, `AUFS`, `Btrfs`, `VFS`, `ZFS` 和 `Device Mapper`。

各 Linux 发行版 Docker 推荐使用的存储驱动如下表。

| Linux 发行版     | Docker 推荐使用的存储驱动                           |
| ---------------- | --------------------------------------------------- |
| Docker on Ubuntu | `overlay2` (16.04 +)                                |
| Docker on Debian | `overlay2` (Debian Stretch), `aufs`, `devicemapper` |
| Docker on CentOS | `overlay2`                                          |
| Docker on Fedora | `overlay2`                                          |

在可能的情况下，[推荐](https://docs.docker.com/storage/storagedriver/select-storage-driver/) 使用 `overlay2` 存储驱动，`overlay2` 是目前 Docker 默认的存储驱动，以前则是 `aufs`。你可以通过配置来使用以上提到的其他类型的存储驱动。

因为[Docker基础技术：AUFS](https://coolshell.cn/articles/17061.html) 这篇文章看着很舒服，所以这里不去找关于overlay2的操作。

> 当你看过了这个UnionFS的技术后，你是不是就明白了，你完全可以用UnionFS这样的技术做出分层的镜像来。

来源一写的很好，自行阅读，我这里不复制过来了。

<br>

## 附录

### 完整代码

```c
/**
 * 使用clone系统调用
 * UTS Namespace，将主机名和域名隔离
 * IPC Namespace，只有在同一个Namespace下的进程才能相互通信
 * PID Namespace, 该进程的pid为1
 * 添加User Namespace，把容器中的uid和真实系统的uid给映射在一起，而不总是相同
 * 用普通用户执行程序
 * 
 * 设置cpu的利用率为10%
 * 用sudo执行程序
 */

#define _GNU_SOURCE
#include <sched.h>
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <signal.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <errno.h>
#include <sys/mount.h>
#include <string.h>
#include <sys/stat.h>

/* 定义一个给 clone 用的栈，栈大小1M */
#define STACK_SIZE (1024*1024)
static char container_stack[STACK_SIZE];

char* const container_args[] = {
    "/bin/bash",
    NULL
};

int pipefd[2];

void set_map(char* file, int inside_id,int outside_id,int len){
    int n=0;
    FILE* mapfd = fopen(file,"w");
    if(mapfd == NULL){
        perror("open file error");
        exit;
    }
    if((n = fprintf(mapfd,"%d %d %d",inside_id,outside_id,len)) <= 0)
        perror("write file error");
    printf("write %s : %d alpha\n",file,n);
    fclose(mapfd);
}

void set_uid_map(pid_t pid,int inside_id,int outside_id,int len){
    char map_rule[256];
    sprintf(map_rule,"/proc/%d/uid_map",pid);
    set_map(map_rule,inside_id,outside_id,len);
}

void set_gid_map(pid_t pid,int inside_id,int outside_id,int len){
    char map_rule[256];
    sprintf(map_rule,"/proc/%d/gid_map",pid);
    set_map(map_rule,inside_id,outside_id,len);
}


int container_main(void* agr){

    /* 等待父进程通知后再往下执行（进程间的同步） */
    char ch;
    close(pipefd[1]);
    read(pipefd[0], &ch, 1);

    printf("Container[%5d] - inside the container!\n",getpid());

    printf("Container: eUID = %ld;  eGID = %ld, UID=%ld, GID=%ld\n",
        (long) geteuid(), (long) getegid(), (long) getuid(), (long) getgid());
    

    sethostname("container",10);
    printf("Container [%5d] - setup hostname!\n", getpid());
    
    // chroot隔离目录
    if(chdir("../../chroot")!=0 || chroot("./")!=0){
        perror("chdir|chroot");
    }
    printf("chroot container itself filesystem\n");

    // 对从父进程复制过来的mount namespace 修改
    if (mount("proc", "/proc", "proc", 0, NULL) !=0 ) {
        perror("proc");
    }
    printf("container mount itself filesystem\n");

    // 执行一个shell，以便查看环境有没有隔离
    execv(container_args[0],container_args);
    printf("somethings's wrong!\n");
    return 1;
}

int main(){
    const int gid=getgid(), uid=getuid();

    printf("Parent[%5d] - start a container!\n",getpid());

    pipe(pipefd);

    /*因为栈向下增长，所以参数为container_stack+STACK_SIZE*/
    // 添加CLONE_NEWUTS，CLONE_NEWIPC,CLONE_NEWPID,CLONE_NEWNS
    int container_pid = clone(container_main,container_stack+STACK_SIZE,
                            CLONE_NEWUTS|CLONE_NEWIPC|CLONE_NEWPID|CLONE_NEWNS|CLONE_NEWUSER|SIGCHLD,NULL);
    
    printf("Parent [%5d] - Container [%5d]!\n", getpid(), container_pid);


    set_uid_map(container_pid, 0, uid, 1);
    set_gid_map(container_pid, 0, gid, 1); 
    printf("Parent [%5d] - user/group mapping done!\n", getpid());

    /* 设置容器对CPU利用率为10% */
    mkdir("/sys/fs/cgroup/cpu/dacao", 755);
    system("echo 10000 > /sys/fs/cgroup/cpu/dacao/cpu.cfs_quota_us");
    char cmd[128];
    sprintf(cmd, "echo %d > /sys/fs/cgroup/cpu/dacao/tasks", container_pid);
    system(cmd); 
    printf("container [%5d] cpu used , have been limited\n",container_pid);

    /* 设置容器不能使用超过5M内存 */
    mkdir("/sys/fs/cgroup/memory/dacao", 755);
    system("echo 5M > /sys/fs/cgroup/memory/dacao/memory.limit_in_bytes");
    char cmd2[128];
    sprintf(cmd2, "echo %d > /sys/fs/cgroup/memory/dacao/tasks", container_pid);
    system(cmd2); 
    printf("container [%5d] memory used , have been limited\n",container_pid);

    // close(pipefd[0]);
    /* 通知子进程：子进程停留在read处，保证set uid/gid执行之后，再执行execv */
    close(pipefd[1]);

    waitpid(container_pid,NULL,0);
    printf("Parent[%5d] - container stop!\n",getpid());
    return 0;
}
```

<br>

### 其他

可以在这两个地方查看该文档与代码：[我的csdn blog](https://blog.csdn.net/sinat_38816924/article/details/111354993) | [我的 github 仓库](https://github.com/da1234cao/programming-language-entry-record/tree/master/docker)