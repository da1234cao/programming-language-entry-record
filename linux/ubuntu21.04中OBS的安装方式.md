[toc]

## 前言

最近脑子一热，给笔记本安装了[Ubuntu 21.04](https://ubuntu.com/download/desktop)

> The latest version of the Ubuntu operating system for desktop PCs and laptops, Ubuntu 21.04 comes with nine months, until January 2022, of security and maintenance updates.
>
> Recommended system requirements are the same as for Ubuntu 20.04.2 LTS. 

笔记本平常也不用，装了便装了。目前来说，不大好用。下面记录了我在ubuntu21.04上安装OBS的过程。

PS：ubuntu21.04之前的版本，按照官网提供的方式安装就好。

另外，这篇博客中，因为对于一些概念我不是很清楚，所以存在用词不是很明确的地方。

<br>

## 摘要

ubuntu21.04默认使用wayland，而非X11，导致录屏软件OBS无法抓取到屏幕。

解决这个问题，有两种方法：

* 第一种是将协议改回使用X11。
* 第二种是使用flatapk[原理我不知道]。

<br>

## linux中原生OBS的安装

开始的时候，我尝试在系统上直接安装OBS。这样做，OBS无法抓取屏幕。但是安装过程也挺有意思，所以这里也记录一下。

### 使用官方源进行安装

进入OBS的[官网](https://obsproject.com/zh-tw)，查看ubuntu中OBS的安装方式。

```shell
➜ sudo apt install ffmpeg
# sudo add-apt-repository ppa:obsproject/obs-studio
➜ sudo apt update
➜ sudo apt install obs-studio
```

我没有add repository，默认安装了这个源[`http://cn.archive.ubuntu.com/ubuntu hirsute/universe`]中obs-studio。此时的OBS版本是26.1.2。它无法采集到ubuntu21.04的屏幕。如下图所示。同时，在OBS采集桌面的时候，火焰截图(v0.8.5-4)，无法对截图部分添加文字。

<img src="./ubuntu21.04中OBS的安装方式.assets/apt-obs1.png" style="zoom:50%;" /> 

```shell
➜ sudo apt purge obs-studio
```

<br>

### 添加PPA

尽量不要直接下载deb包进行安装。因为有可能无法使用upgrade进行更新。我习惯使用google `<软件包名> + ppa`的方式进行安装。关于ppa的介绍可以参考：[add-apt-repository命令详解](https://blog.csdn.net/qq_43406338/article/details/111027654)

这里是chrome和vscode使用ppa的安装方式，相当方便：[3rd Party Repository: Google Chrome](https://www.ubuntuupdates.org/ppa/google_chrome)、[3rd Party Repository: VSCode](https://www.ubuntuupdates.org/ppa/vscode)

ps：`apt-add-repository`和`add-apt-repository` 作用相同。因为前者是后者的软链接。喜欢用哪个都成。

```shell
➜ add-apt-repository ppa:obsproject/obs-studio

Repository: 'deb http://ppa.launchpad.net/obsproject/obs-studio/ubuntu/ hirsute main'
Description:
Latest stable release of OBS Studio
More info: https://launchpad.net/~obsproject/+archive/ubuntu/obs-studio
Adding repository.
Press [ENTER] to continue or Ctrl-c to cancel.
Adding deb entry to /etc/apt/sources.list.d/obsproject-ubuntu-obs-studio-hirsute.list
Adding disabled deb-src entry to /etc/apt/sources.list.d/obsproject-ubuntu-obs-studio-hirsute.list
Adding key to /etc/apt/trusted.gpg.d/obsproject-ubuntu-obs-studio.gpg with fingerprint BC7345F522079769F5BBE987EFC71127F425E228
...
错误:7 http://ppa.launchpad.net/obsproject/obs-studio/ubuntu hirsute Release   
  404  Not Found [IP: 2001:67c:1560:8008::19 80]
...
E: 仓库 “ hirsute Release” 没有 Release 文件。
N: 无法安全地用该源进行更新，所以默认禁用该源。
N: 参见 apt-secure(8) 手册以了解仓库创建和用户配置方面的细节。
...
```

没有release。。我们到[obsproject](https://launchpad.net/~obsproject)中，可以看到[OBS Studio](https://launchpad.net/~obsproject/+archive/ubuntu/obs-studio) 和 [OBS Studio Unstable](https://launchpad.net/~obsproject/+archive/ubuntu/obs-studio-unstable) 。OBS Studio中最新稳定版本，没有ubuntu21的。但是OBS Studio Unstable有。

那很简单了，我们替换使用unstable的版本试试。

```shell
➜ sudo add-apt-repository -r ppa:obsproject/obs-studio
➜ sudo add-apt-repository  ppa:obsproject/obs-studio-unstable

# ➜ sudo apt update
➜ sudo apt install obs-studio
```

<img src="./ubuntu21.04中OBS的安装方式.assets/apt-obs2.png" style="zoom:50%;" /> 

一边快乐的扣手机，一边等待安装完成。但是，，安装完成之后，看到最新的unstable版本也不行。

给它删了。

```shell
➜ sudo apt purge obs-studio
➜ sudo add-apt-repository -r ppa:obsproject/obs-studio-unstable
```

<br>

## 分析原因

### 搜索资料

我用中文搜索了下，看到win10中OBS黑屏的解决办法：[【OBS】最新版OBS黑屏问题的解决办法！win10用户进来看！-- TimLiu_-- bilibili](https://www.bilibili.com/video/av31993205/)

我可以将win10中的这个解决思路，搬到ubuntu21中查看下吗？我估计办不到，能力不行\^\_\^。

那我再用英文搜索：`ubuntu obs-studio blank screen`。我从已知原因的角度，顺序讲解。

1. 我们需要查看Ubuntu21.04相对于Ubuntu20.04有哪些不同：[Ubuntu 21.04: Yes, there ARE new features - Review + variants -- The Linux Experiment -- youtube](https://www.youtube.com/watch?v=1ircvlirJEQ) | [Hirsute Hippo Release Notes -- 官方文档 -- 略](https://discourse.ubuntu.com/t/hirsute-hippo-release-notes/19221)

   > The first thing of note is that Ubuntu 21.04 uses Wayland by default.

2. wayland和OBS有什么关系：[Native OBS Support Finally Coming To Wayland -- Brodie Robertson -- youtube](https://youtu.be/iP-bBT4iCxg?t=33)

   > obs可以捕获音频，但是桌面捕获并不完全可以。obs的linux构建基础上拒绝于x11。你可以通过xwanland运行它，但是你仍然不能真正的进行桌面捕获并给你带来一些开销。**原因是wayland协议实际上并未提供与捕获x11相同的api**。
   >
   > 有人为obs制作了一个插件，这个插件可以让obs在wayland上进行桌面捕获。插件在gitlab上，名字叫obs-xdg-portal。并且这个插件代码已经合并到 obs 27中。【？？那为啥我上面的obs 27不行？？】。它的原理是利用pipewire。
   >
   > 还有个关键词flatpak，[Flatpak Improvements]但是我没听懂他在说啥。。[我的原因]

3. wayland是什么：[WAYLAND: what is it, and is it ready for daily use? -- The Linux Experiment -- youtube](https://www.youtube.com/watch?v=g1BoZnekkyM)

   > 也许大家，感兴趣的Linux桌面已经听说了韦兰。接下来的大事，是X.org的替代品，它是在Linux上的性能和图形方面解决了许多麻烦的解决方案。...

**PS个人理解：通过上面的视频，我们知道xwayland和obs-xdg-portal，可以在一定程度上解决问题。但是flatpak可以很好的解决。flatpak也是我唯一尝试过在wayland上使用obs-studio的方法**。

下面，我们顺便瞅瞅 wayland和X11的相关内容。

<br>

### wayland和X11

很早之前，我在看《鸟哥私房菜》的时候看过X11：[第二十三章、X Window 設定介紹](http://linux.vbird.org/linux_basic/0590xwindow.php)

wayland官方文档中也给出了Wayland Architecture和的区别：[Wayland Architecture](https://wayland.freedesktop.org/architecture.html)

我不怎么明白里面的含义，但是为了blog的好看，我把它俩的结构图搬到这里，o(∩∩)o...哈哈。

<img src="./ubuntu21.04中OBS的安装方式.assets/x-architecture.png" style="zoom:80%;" /> 

<img src="./ubuntu21.04中OBS的安装方式.assets/wayland-architecture.png" style="zoom:80%;" />  

既然知道是wayland的原因，导致obs无法使用。那我们将其切换回X11，应该便可以解决问题。结果也确实如此，如下所示。

<br>

### 解决方法一：wayland_to_Xorg

将ubuntu21.04默认的wayland切换成Xorg，这样obs-studio便可以正常工作了。

图形化切换方式也很简单，注销之后，点击密码框，在屏幕的右下角设置里面变可以切换了。如下图所示。

【命令行解决的话，可以参考这里，但是我没有验证这两者是不是同一件事：[Ubuntu 20.04 Black screen issue not even cursor for window capture](https://obsproject.com/forum/threads/ubuntu-20-04-black-screen-issue-not-even-cursor-for-window-capture.135087/)】

<img src="./ubuntu21.04中OBS的安装方式.assets/wayland_to_xorg.png" style="zoom:60%;" />   

之后，obs可以正常工作了。

<img src="./ubuntu21.04中OBS的安装方式.assets/Xorg-obs.png" style="zoom:60%;" />  

但是，使用这个方式，我的整个桌面使用的都是Xorg。这并不是我想要的。

```shell
➜ sudo apt purge obs-studio
```

<br>

## 隔离环境

obs这件事，或许不应该从隔离环境的角度来考虑这个问题。~~因为这里默认只有wayland，而隔离环境中也无法提供X11作用。~~

但既然是使用flatapk来解决问题，我们不妨看下这两个视频：[Snap VS Flatpak -- Houge_Langley -- bilibili](https://www.bilibili.com/video/BV1JK4y1f7T5?from=search&seid=9014680100276155253) | [Flatpak vs Snaps vs Appimage vs Packages - Linux packaging formats compared -- The Linux Experiment -- youtube](https://youtu.be/9HuExVD56Bo)

隔离环境很有用，特别是在新的系统推出，一些用户软件还没来得及更新适配的时候。这时候，隔离环境可以帮我们解决临时之需。待用户软件更新，舍弃使用隔离环境，继续使用原生软件。

<br>

### 解决方法二：flatpak

官方文档：[Flatpak简介]()

Flatpak是一个用于在Linux上分发桌面应用程序的框架。它类似于一个沙箱，可以将一些依赖整体打包。

[flatapk 命令](https://docs.flatpak.org/zh_CN/latest/using-flatpak.html)并不复杂，我们使用flatpat安装obs-studio。

我们到 [Flathub](https://flathub.org/) 中搜索obs，找到[OBS Studio](https://flathub.org/apps/details/com.obsproject.Studio)。然后按照它的方式安装就好。

```shell
# 安装Flatpak
➜ sudo apt install flatpak

# 添加Flathub存储库
➜ flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo

# 列出远程仓库
➜ flatpak remotes

# 从flathub仓库中安装obs
➜ flatpak install flathub com.obsproject.Studio

# 列出安装的应用
➜ flatpak list --app

# 可以选择从命令行启动
➜ flatpak run com.obsproject.Studio
# 也可以点击应用程序图标启动

# 如果将来想要删除它
➜ flatpak uninstall com.obsproject.Studio

# 也可以删除仓库
➜ flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo

# 如果需要更新：更新所有的应用和运行时到最新版本
➜ flatpak update
```

**结果如下，obs可以正常使用，也不会对其他程序造成干扰，good**。

<img src="./ubuntu21.04中OBS的安装方式.assets/obs-flatapk1.png" style="zoom:60%;" />  

<img src="./ubuntu21.04中OBS的安装方式.assets/obs-flatapk2.png" style="zoom:60%;" />  

我们也可以创建自己的flatapk应用：[创建GTK+ flatpak 应用](https://www.bilibili.com/video/BV1Es411s7NW?from=search&seid=9014680100276155253)

还看到一个好玩的：[linux使用flatpak快速安装TIM，QQ，微信，迅雷，百度云 - 问题修复版 -- Live in linux](https://www.bilibili.com/video/BV1xb411b7kx/?spm_id_from=trigger_reload)

<br>

### 其他

另外两个我没有尝试：[OBS Studio -- snap](https://snapcraft.io/obs-studio)、[OBS Studio -- appimage](https://www.appimagehub.com/p/1409898/)

我还在docker hub中搜了以下[OBS Studio -- docker](https://hub.docker.com/search?q=obs%20studio&type=image)。没找见是比较right的。关于docker可以参考我之前的一篇文章，虽然挺烂：[docker入门](https://blog.csdn.net/sinat_38816924/article/details/111354993)

